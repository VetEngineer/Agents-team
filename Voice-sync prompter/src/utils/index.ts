export { normalizeText, tokenize, tokenSimilarity } from './textNormalizer'
export {
  findBestMatch,
  findMatchingLine,
  calculateLineProgress,
  detectBackwardKeyword,
  ContinuousMatcher,
  type MatchResult,
  type LineProgressResult,
  type LineMatchResult,
  type FindMatchingLineOptions,
} from './textMatcher'
export { transcribeAudio, validateApiKey } from './whisperApi'
export { processWhisperResponse, mergeChunkTranscriptions, smoothChunkBoundaries, getFullText } from './chunkMerger'
export { alignSegmentsToScript, correctSegmentText, extractScriptChunk } from './textAlignment'
export { generateSrt, downloadSrt, formatSrtTime, extractFullText, generateVtt, downloadVtt } from './srtGenerator'
