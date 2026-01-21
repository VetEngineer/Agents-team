import type {
  ChunkTranscription,
  TranscriptionSegment,
  WhisperResponse,
} from './types/whisper'
import { CHUNK_DURATION_SECONDS } from './types/whisper'

// Whisper 응답을 ChunkTranscription으로 변환 (오프셋 적용)
export const processWhisperResponse = (
  response: WhisperResponse,
  chunkIndex: number
): ChunkTranscription => {
  // 오프셋 계산: 청크 인덱스 × 10분(600초)
  const timeOffset = chunkIndex * CHUNK_DURATION_SECONDS

  // 세그먼트에 오프셋 적용
  const segments: TranscriptionSegment[] = response.segments.map((segment, idx) => ({
    id: chunkIndex * 10000 + idx,  // 고유 ID 생성
    start: segment.start + timeOffset,
    end: segment.end + timeOffset,
    text: segment.text.trim(),
    chunkIndex,
  }))

  return {
    chunkIndex,
    segments,
    text: response.text,
    duration: response.duration,
    status: 'completed',
  }
}

// 여러 청크의 트랜스크립션 결과 병합
export const mergeChunkTranscriptions = (
  transcriptions: ChunkTranscription[]
): TranscriptionSegment[] => {
  // 청크 인덱스 순으로 정렬
  const sorted = [...transcriptions]
    .filter(t => t.status === 'completed')
    .sort((a, b) => a.chunkIndex - b.chunkIndex)

  // 모든 세그먼트 병합
  const allSegments: TranscriptionSegment[] = []

  for (const transcription of sorted) {
    allSegments.push(...transcription.segments)
  }

  // 시작 시간 순으로 정렬
  allSegments.sort((a, b) => a.start - b.start)

  // 중복 세그먼트 제거 (청크 경계에서 발생할 수 있음)
  const deduped = deduplicateSegments(allSegments)

  // ID 재할당
  return deduped.map((segment, idx) => ({
    ...segment,
    id: idx + 1,
  }))
}

// 중복 세그먼트 제거
const deduplicateSegments = (segments: TranscriptionSegment[]): TranscriptionSegment[] => {
  if (segments.length === 0) return []

  const result: TranscriptionSegment[] = [segments[0]]

  for (let i = 1; i < segments.length; i++) {
    const current = segments[i]
    const previous = result[result.length - 1]

    // 이전 세그먼트와 너무 가까우면 (0.5초 이내) 텍스트 비교
    if (current.start - previous.end < 0.5) {
      // 텍스트가 유사하면 스킵 (중복으로 간주)
      if (isSimilarText(previous.text, current.text)) {
        // 종료 시간만 업데이트
        previous.end = Math.max(previous.end, current.end)
        continue
      }
    }

    result.push(current)
  }

  return result
}

// 텍스트 유사도 체크 (간단한 구현)
const isSimilarText = (text1: string, text2: string): boolean => {
  const normalized1 = text1.replace(/\s+/g, '').toLowerCase()
  const normalized2 = text2.replace(/\s+/g, '').toLowerCase()

  // 한쪽이 다른 쪽을 포함하면 유사
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true
  }

  // 첫 5글자가 같으면 유사 (청크 경계에서 잘린 경우)
  if (normalized1.slice(0, 5) === normalized2.slice(0, 5)) {
    return true
  }

  return false
}

// 청크 경계에서 세그먼트 연결 개선
export const smoothChunkBoundaries = (
  segments: TranscriptionSegment[],
  chunkDuration: number = CHUNK_DURATION_SECONDS
): TranscriptionSegment[] => {
  if (segments.length <= 1) return segments

  const result: TranscriptionSegment[] = []

  for (let i = 0; i < segments.length; i++) {
    const segment = { ...segments[i] }

    // 청크 경계 근처인지 확인
    const chunkBoundary = Math.round(segment.start / chunkDuration) * chunkDuration

    // 경계에서 0.5초 이내면 약간 조정
    if (Math.abs(segment.start - chunkBoundary) < 0.5 && chunkBoundary > 0) {
      const prevSegment = result[result.length - 1]
      if (prevSegment && segment.start - prevSegment.end < 0.3) {
        // 이전 세그먼트와 자연스럽게 연결
        segment.start = prevSegment.end + 0.01
      }
    }

    result.push(segment)
  }

  return result
}

// 전체 텍스트 추출
export const getFullText = (transcriptions: ChunkTranscription[]): string => {
  return transcriptions
    .filter(t => t.status === 'completed')
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .map(t => t.text)
    .join(' ')
}
