// Whisper API 관련 타입 정의

// 녹음 청크 정보
export interface ChunkInfo {
  index: number
  blob: Blob
  startTime: number  // 전체 녹음에서의 시작 시간 (초)
  duration: number   // 청크 길이 (초)
}

// Whisper API verbose_json 응답의 세그먼트
export interface WhisperSegment {
  id: number
  seek: number
  start: number
  end: number
  text: string
  tokens: number[]
  temperature: number
  avg_logprob: number
  compression_ratio: number
  no_speech_prob: number
}

// Whisper API verbose_json 응답
export interface WhisperResponse {
  task: string
  language: string
  duration: number
  text: string
  segments: WhisperSegment[]
}

// 타임스탬프 오프셋이 적용된 세그먼트
export interface TranscriptionSegment {
  id: number
  start: number  // 오프셋 적용된 시작 시간 (초)
  end: number    // 오프셋 적용된 종료 시간 (초)
  text: string
  chunkIndex: number
}

// 청크별 트랜스크립션 결과
export interface ChunkTranscription {
  chunkIndex: number
  segments: TranscriptionSegment[]
  text: string
  duration: number
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

// 파이프라인 상태
export interface PipelineState {
  isRecording: boolean
  isPaused: boolean
  isProcessing: boolean
  currentChunkIndex: number
  totalDuration: number
  chunks: ChunkInfo[]
  transcriptions: ChunkTranscription[]
  completedChunks: number
  processingChunks: number
}

// 녹음 상태
export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'processing' | 'completed' | 'error'

// Whisper API 에러 타입
export interface WhisperError {
  type: 'auth' | 'rate_limit' | 'file_size' | 'network' | 'unknown'
  message: string
  status?: number
}

// SRT 자막 항목
export interface SrtEntry {
  index: number
  startTime: string  // "00:00:00,000" 형식
  endTime: string
  text: string
}

// 자막 설정
export interface SubtitleSettings {
  maxCharsPerLine: number      // 한 줄 최대 글자 수 (15-40)
  linesPerSubtitle: number     // 자막당 줄 수 (1 또는 2)
  openaiApiKey: string         // OpenAI API 키
  useScriptReference: boolean  // 대본 참조 사용 여부
}

// 청크 처리 콜백
export type OnChunkCompleteCallback = (chunk: ChunkInfo) => void
export type OnTranscriptionCompleteCallback = (transcription: ChunkTranscription) => void

// 청크 분할 설정
export const CHUNK_DURATION_SECONDS = 600  // 10분
export const MAX_FILE_SIZE_MB = 25         // Whisper API 제한
