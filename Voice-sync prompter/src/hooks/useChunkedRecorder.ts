import { useRef, useCallback, useEffect } from 'react'
import { useRecordingStore } from '@/store'
import type { ChunkInfo, OnChunkCompleteCallback } from '@/types/whisper'
import { CHUNK_DURATION_SECONDS } from '@/types/whisper'

interface UseChunkedRecorderOptions {
  onChunkComplete?: OnChunkCompleteCallback
}

interface UseChunkedRecorderReturn {
  startRecording: () => Promise<void>
  stopRecording: () => Promise<ChunkInfo | null>
  pauseRecording: () => void
  resumeRecording: () => void
  isRecording: boolean
  isPaused: boolean
  currentChunkIndex: number
  currentChunkDuration: number
  totalDuration: number
}

export const useChunkedRecorder = ({
  onChunkComplete
}: UseChunkedRecorderOptions = {}): UseChunkedRecorderReturn => {
  const {
    status,
    currentChunkIndex,
    currentChunkDuration,
    totalDuration,
    setStatus,
    setCurrentChunkIndex,
    setCurrentChunkDuration,
    setTotalDuration,
    addChunk,
    setErrorMessage,
    reset: resetStore,
  } = useRecordingStore()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksDataRef = useRef<Blob[]>([])
  const chunkStartTimeRef = useRef<number>(0)
  const totalStartTimeRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isRecording = status === 'recording'
  const isPaused = status === 'paused'

  // 타이머 업데이트
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        const now = Date.now()
        const totalElapsed = (now - totalStartTimeRef.current) / 1000
        const chunkElapsed = (now - chunkStartTimeRef.current) / 1000

        setTotalDuration(totalElapsed)
        setCurrentChunkDuration(chunkElapsed)
      }, 100)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [isRecording, setTotalDuration, setCurrentChunkDuration])

  // 청크 완료 처리
  const finalizeChunk = useCallback(async (isLastChunk: boolean = false): Promise<ChunkInfo | null> => {
    if (chunksDataRef.current.length === 0) return null

    const blob = new Blob(chunksDataRef.current, { type: 'audio/webm' })
    const duration = (Date.now() - chunkStartTimeRef.current) / 1000
    const startTime = currentChunkIndex * CHUNK_DURATION_SECONDS

    const chunkInfo: ChunkInfo = {
      index: currentChunkIndex,
      blob,
      startTime,
      duration,
    }

    addChunk(chunkInfo)
    chunksDataRef.current = []

    if (onChunkComplete && !isLastChunk) {
      onChunkComplete(chunkInfo)
    }

    return chunkInfo
  }, [currentChunkIndex, addChunk, onChunkComplete])

  // 새 청크 시작
  const startNewChunk = useCallback(() => {
    chunkStartTimeRef.current = Date.now()
    setCurrentChunkIndex(currentChunkIndex + 1)
    setCurrentChunkDuration(0)
  }, [currentChunkIndex, setCurrentChunkIndex, setCurrentChunkDuration])

  // 10분 청크 타이머 설정
  const setupChunkTimer = useCallback(() => {
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current)
    }

    chunkTimerRef.current = setTimeout(async () => {
      if (status === 'recording' && mediaRecorderRef.current) {
        // 현재 청크 완료
        const chunk = await finalizeChunk(false)

        // 새 청크 시작
        startNewChunk()

        // 콜백 호출 (백그라운드 API 처리)
        if (chunk && onChunkComplete) {
          onChunkComplete(chunk)
        }

        // 다음 청크 타이머 설정
        setupChunkTimer()
      }
    }, CHUNK_DURATION_SECONDS * 1000)
  }, [status, finalizeChunk, startNewChunk, onChunkComplete])

  // 녹음 시작
  const startRecording = useCallback(async () => {
    try {
      resetStore()
      setStatus('recording')
      setErrorMessage(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      })

      streamRef.current = stream
      chunksDataRef.current = []

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksDataRef.current.push(event.data)
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        setStatus('error')
        setErrorMessage('녹음 중 오류가 발생했습니다')
      }

      mediaRecorderRef.current = mediaRecorder

      // 시작 시간 설정
      totalStartTimeRef.current = Date.now()
      chunkStartTimeRef.current = Date.now()

      // 녹음 시작 (100ms마다 데이터 수집)
      mediaRecorder.start(100)

      // 10분 청크 타이머 설정
      setupChunkTimer()

    } catch (error) {
      console.error('Failed to start recording:', error)
      setStatus('error')

      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setErrorMessage('마이크 권한이 필요합니다')
        } else if (error.name === 'NotFoundError') {
          setErrorMessage('마이크를 찾을 수 없습니다')
        } else {
          setErrorMessage('마이크 접근에 실패했습니다')
        }
      } else {
        setErrorMessage('녹음을 시작할 수 없습니다')
      }
    }
  }, [resetStore, setStatus, setErrorMessage, setupChunkTimer])

  // 녹음 중지
  const stopRecording = useCallback(async (): Promise<ChunkInfo | null> => {
    // 청크 타이머 정리
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current)
      chunkTimerRef.current = null
    }

    if (!mediaRecorderRef.current || status === 'idle') {
      return null
    }

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!

      mediaRecorder.onstop = async () => {
        // 마지막 청크 완료
        const lastChunk = await finalizeChunk(true)

        // 스트림 정리
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
          streamRef.current = null
        }

        mediaRecorderRef.current = null
        setStatus('processing')

        resolve(lastChunk)
      }

      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop()
      } else {
        setStatus('processing')
        resolve(null)
      }
    })
  }, [status, finalizeChunk, setStatus])

  // 녹음 일시정지
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'recording') {
      mediaRecorderRef.current.pause()
      setStatus('paused')

      // 청크 타이머 정지
      if (chunkTimerRef.current) {
        clearTimeout(chunkTimerRef.current)
        chunkTimerRef.current = null
      }
    }
  }, [status, setStatus])

  // 녹음 재개
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === 'paused') {
      mediaRecorderRef.current.resume()
      setStatus('recording')

      // 청크 타이머 재설정 (남은 시간 계산)
      const elapsed = currentChunkDuration
      const remaining = CHUNK_DURATION_SECONDS - elapsed

      if (remaining > 0) {
        chunkTimerRef.current = setTimeout(async () => {
          // mediaRecorderRef로 녹음 상태 확인
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            const chunk = await finalizeChunk(false)
            startNewChunk()
            if (chunk && onChunkComplete) {
              onChunkComplete(chunk)
            }
            setupChunkTimer()
          }
        }, remaining * 1000)
      }
    }
  }, [status, currentChunkDuration, setStatus, finalizeChunk, startNewChunk, onChunkComplete, setupChunkTimer])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (chunkTimerRef.current) {
        clearTimeout(chunkTimerRef.current)
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return {
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isRecording,
    isPaused,
    currentChunkIndex,
    currentChunkDuration,
    totalDuration,
  }
}
