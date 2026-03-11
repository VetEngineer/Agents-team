import { useCallback, useRef } from 'react'
import { useRecordingStore, useSubtitleSettingsStore, useScriptStore } from '@/store'
import { transcribeAudio } from '@/utils/whisperApi'
import { processWhisperResponse, mergeChunkTranscriptions, smoothChunkBoundaries } from '@/utils/chunkMerger'
import { alignSegmentsToScript, extractScriptChunk } from '@/utils/textAlignment'
import type { ChunkInfo, ChunkTranscription, TranscriptionSegment, WhisperError } from '@/types/whisper'

interface UseWhisperPipelineReturn {
  processChunk: (chunk: ChunkInfo) => Promise<ChunkTranscription | null>
  processAllChunks: () => Promise<TranscriptionSegment[]>
  finalizeAndMerge: () => TranscriptionSegment[]
  isProcessing: boolean
  error: string | null
}

export const useWhisperPipeline = (): UseWhisperPipelineReturn => {
  const {
    chunks,
    transcriptions,
    setProcessingChunks,
    addTranscription,
    updateTranscription,
    incrementCompletedChunks,
    setMergedSegments,
    setErrorMessage,
    setStatus,
    setSrtReady,
  } = useRecordingStore()

  const { openaiApiKey, useScriptReference } = useSubtitleSettingsStore()
  const { text: scriptText } = useScriptStore()

  const processingRef = useRef<Set<number>>(new Set())
  const isProcessing = processingRef.current.size > 0

  // 단일 청크 처리
  const processChunk = useCallback(async (chunk: ChunkInfo): Promise<ChunkTranscription | null> => {
    if (!openaiApiKey) {
      setErrorMessage('API 키가 설정되지 않았습니다')
      return null
    }

    // 이미 처리 중이면 스킵
    if (processingRef.current.has(chunk.index)) {
      return null
    }

    // 처리 상태 추가
    processingRef.current.add(chunk.index)
    setProcessingChunks(processingRef.current.size)

    // 초기 transcription 레코드 추가
    const initialTranscription: ChunkTranscription = {
      chunkIndex: chunk.index,
      segments: [],
      text: '',
      duration: 0,
      status: 'processing',
    }
    addTranscription(initialTranscription)

    try {
      // 대본 힌트 준비 (사용 설정 시)
      const prompt = useScriptReference && scriptText
        ? extractScriptChunk(scriptText, chunk.index)
        : undefined

      // Whisper API 호출
      const response = await transcribeAudio({
        apiKey: openaiApiKey,
        audioBlob: chunk.blob,
        language: 'ko',
        prompt,
      })

      // 응답 처리 (오프셋 적용)
      const transcription = processWhisperResponse(response, chunk.index)

      // 대본 정렬 (사용 설정 시)
      if (useScriptReference && scriptText) {
        transcription.segments = alignSegmentsToScript(transcription.segments, scriptText)
      }

      // 결과 업데이트
      updateTranscription(chunk.index, {
        ...transcription,
        status: 'completed',
      })

      incrementCompletedChunks()

      return transcription

    } catch (error) {
      const whisperError = error as WhisperError
      const errorMessage = whisperError.message || '트랜스크립션 실패'

      updateTranscription(chunk.index, {
        status: 'error',
        error: errorMessage,
      })

      setErrorMessage(`청크 ${chunk.index + 1} 처리 실패: ${errorMessage}`)

      return null

    } finally {
      // 처리 상태 제거
      processingRef.current.delete(chunk.index)
      setProcessingChunks(processingRef.current.size)
    }
  }, [
    openaiApiKey,
    useScriptReference,
    scriptText,
    setProcessingChunks,
    addTranscription,
    updateTranscription,
    incrementCompletedChunks,
    setErrorMessage,
  ])

  // 모든 청크 처리 (병렬이 아닌 순차 처리로 API 부하 감소)
  const processAllChunks = useCallback(async (): Promise<TranscriptionSegment[]> => {
    const pendingChunks = chunks.filter(chunk => {
      const existing = transcriptions.find(t => t.chunkIndex === chunk.index)
      return !existing || existing.status === 'error'
    })

    for (const chunk of pendingChunks) {
      await processChunk(chunk)
    }

    return finalizeAndMerge()
  }, [chunks, transcriptions, processChunk])

  // 최종 병합
  const finalizeAndMerge = useCallback((): TranscriptionSegment[] => {
    // 완료된 트랜스크립션만 병합
    const completedTranscriptions = transcriptions.filter(t => t.status === 'completed')

    if (completedTranscriptions.length === 0) {
      return []
    }

    // 청크 병합
    let mergedSegments = mergeChunkTranscriptions(completedTranscriptions)

    // 청크 경계 스무딩
    mergedSegments = smoothChunkBoundaries(mergedSegments)

    // 대본 정렬 최종 적용
    if (useScriptReference && scriptText) {
      mergedSegments = alignSegmentsToScript(mergedSegments, scriptText)
    }

    setMergedSegments(mergedSegments)
    setStatus('completed')
    setSrtReady(true)

    return mergedSegments
  }, [transcriptions, useScriptReference, scriptText, setMergedSegments, setStatus, setSrtReady])

  const error = useRecordingStore.getState().errorMessage

  return {
    processChunk,
    processAllChunks,
    finalizeAndMerge,
    isProcessing,
    error,
  }
}
