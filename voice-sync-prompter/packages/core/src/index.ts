// Types
export * from './types/whisper'

// Text processing utilities
export { normalizeText, tokenize, tokenSimilarity } from './textNormalizer'
export type { NormalizeOptions } from './textNormalizer'

export {
  findBestMatch,
  findMatchingLine,
  calculateLineProgress,
  detectBackwardKeyword,
  ContinuousMatcher,
} from './textMatcher'
export type {
  MatchResult,
  LineProgressResult,
  LineMatchResult,
  FindMatchingLineOptions,
} from './textMatcher'

// Chunk processing
export {
  processWhisperResponse,
  mergeChunkTranscriptions,
  smoothChunkBoundaries,
  getFullText,
} from './chunkMerger'

// Text alignment
export {
  alignSegmentsToScript,
  correctSegmentText,
  extractScriptChunk,
} from './textAlignment'

// Subtitle generation
export {
  generateSrt,
  formatSrtTime,
  extractFullText,
  generateVtt,
  mergeAudioChunks,
} from './srtGenerator'
