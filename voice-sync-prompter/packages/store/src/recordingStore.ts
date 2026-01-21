import { create } from 'zustand'
import type {
  RecordingStatus,
  ChunkInfo,
  ChunkTranscription,
  TranscriptionSegment
} from '@vsp/core'

interface RecordingState {
  // 녹음 상태
  status: RecordingStatus
  // 현재 청크 인덱스
  currentChunkIndex: number
  // 전체 녹음 시간 (초)
  totalDuration: number
  // 현재 청크 녹음 시간 (초)
  currentChunkDuration: number
  // 녹음된 청크 목록
  chunks: ChunkInfo[]
  // 트랜스크립션 결과 목록
  transcriptions: ChunkTranscription[]
  // 에러 메시지
  errorMessage: string | null
  // 처리 완료된 청크 수
  completedChunks: number
  // 현재 처리 중인 청크 수
  processingChunks: number
  // 최종 병합된 세그먼트 (모든 청크 처리 완료 후)
  mergedSegments: TranscriptionSegment[]
  // SRT 다운로드 준비 완료
  srtReady: boolean
  // 병합된 오디오 Blob
  mergedAudioBlob: Blob | null
  // 오디오 다운로드 준비 완료
  audioReady: boolean

  // Actions
  setStatus: (status: RecordingStatus) => void
  setCurrentChunkIndex: (index: number) => void
  setTotalDuration: (duration: number) => void
  setCurrentChunkDuration: (duration: number) => void
  addChunk: (chunk: ChunkInfo) => void
  addTranscription: (transcription: ChunkTranscription) => void
  updateTranscription: (chunkIndex: number, update: Partial<ChunkTranscription>) => void
  setErrorMessage: (message: string | null) => void
  incrementCompletedChunks: () => void
  setProcessingChunks: (count: number) => void
  setMergedSegments: (segments: TranscriptionSegment[]) => void
  setSrtReady: (ready: boolean) => void
  setMergedAudioBlob: (blob: Blob | null) => void
  setAudioReady: (ready: boolean) => void
  reset: () => void
}

const initialState = {
  status: 'idle' as RecordingStatus,
  currentChunkIndex: 0,
  totalDuration: 0,
  currentChunkDuration: 0,
  chunks: [] as ChunkInfo[],
  transcriptions: [] as ChunkTranscription[],
  errorMessage: null as string | null,
  completedChunks: 0,
  processingChunks: 0,
  mergedSegments: [] as TranscriptionSegment[],
  srtReady: false,
  mergedAudioBlob: null as Blob | null,
  audioReady: false,
}

/**
 * 녹음 스토어 생성 팩토리
 * 영속성이 필요 없는 런타임 상태
 */
export const createRecordingStore = () =>
  create<RecordingState>()((set) => ({
    ...initialState,

    setStatus: (status) => set({ status }),

    setCurrentChunkIndex: (currentChunkIndex) => set({ currentChunkIndex }),

    setTotalDuration: (totalDuration) => set({ totalDuration }),

    setCurrentChunkDuration: (currentChunkDuration) => set({ currentChunkDuration }),

    addChunk: (chunk) => set((state) => ({
      chunks: [...state.chunks, chunk]
    })),

    addTranscription: (transcription) => set((state) => ({
      transcriptions: [...state.transcriptions, transcription]
    })),

    updateTranscription: (chunkIndex, update) => set((state) => ({
      transcriptions: state.transcriptions.map((t) =>
        t.chunkIndex === chunkIndex ? { ...t, ...update } : t
      )
    })),

    setErrorMessage: (errorMessage) => set({ errorMessage }),

    incrementCompletedChunks: () => set((state) => ({
      completedChunks: state.completedChunks + 1
    })),

    setProcessingChunks: (processingChunks) => set({ processingChunks }),

    setMergedSegments: (mergedSegments) => set({ mergedSegments }),

    setSrtReady: (srtReady) => set({ srtReady }),

    setMergedAudioBlob: (mergedAudioBlob) => set({ mergedAudioBlob }),

    setAudioReady: (audioReady) => set({ audioReady }),

    reset: () => set(initialState),
  }))

/**
 * 기본 녹음 스토어
 */
export const useRecordingStore = createRecordingStore()
