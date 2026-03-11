import { distance } from 'fastest-levenshtein'
import { normalizeText } from './textNormalizer'

export interface MatchResult {
  position: number      // 매칭된 문자 위치 (원본 텍스트 기준)
  confidence: number    // 신뢰도 (0-1)
  matchedText: string   // 실제 매칭된 텍스트
}

export interface LineProgressResult {
  progress: number      // 0.0 ~ 1.0 (진행도)
  matchedLength: number // 매칭된 길이
  totalLength: number   // 전체 줄 길이
}

export interface LineMatchResult {
  lineIndex: number
  confidence: number
  direction: 'forward' | 'backward' | 'same'
}

export interface FindMatchingLineOptions {
  forwardBias: number       // 전진 보너스 (기본값: 0.1)
  backwardThreshold: number // 이전 줄 이동 임계값 (기본값: 0.7)
  forwardThreshold: number  // 다음 줄 이동 임계값 (기본값: 0.4)
}

/**
 * 후진 키워드 감지 (사용자가 "다시" 등을 말했을 때)
 */
export const detectBackwardKeyword = (recognizedText: string): {
  detected: boolean
  keyword: string | null
} => {
  const backwardKeywords = ['다시', '다시요', '뒤로', '이전']
  const normalized = normalizeText(recognizedText)

  for (const keyword of backwardKeywords) {
    if (normalized.includes(keyword)) {
      return { detected: true, keyword }
    }
  }
  return { detected: false, keyword: null }
}

/**
 * Levenshtein Distance 기반 유사도 계산
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  if (str1.length === 0 && str2.length === 0) return 1
  if (str1.length === 0 || str2.length === 0) return 0

  const maxLen = Math.max(str1.length, str2.length)
  const dist = distance(str1, str2)

  return 1 - dist / maxLen
}

/**
 * 슬라이딩 윈도우로 최적의 매칭 위치 찾기
 *
 * @param scriptText - 전체 대본 텍스트
 * @param recognizedText - 음성 인식된 텍스트
 * @param currentPosition - 현재 위치
 * @param searchRange - 검색 범위 (현재 위치 ± searchRange)
 * @param windowSize - 슬라이딩 윈도우 크기 (음성 인식 텍스트 길이의 배수)
 */
export const findBestMatch = (
  scriptText: string,
  recognizedText: string,
  currentPosition: number = 0,
  searchRange: number = 500,
  windowSize: number = 1.5
): MatchResult | null => {
  if (!recognizedText.trim() || !scriptText.trim()) {
    return null
  }

  const normalizedRecognized = normalizeText(recognizedText, { removeSpaces: true })

  if (normalizedRecognized.length < 2) {
    return null
  }

  // 검색 범위 계산
  const searchStart = Math.max(0, currentPosition - searchRange)
  const searchEnd = Math.min(scriptText.length, currentPosition + searchRange)
  const searchText = scriptText.substring(searchStart, searchEnd)

  // 윈도우 크기 계산 (인식된 텍스트 길이의 배수)
  const actualWindowSize = Math.ceil(normalizedRecognized.length * windowSize)

  let bestMatch: MatchResult | null = null
  let bestSimilarity = 0

  // 슬라이딩 윈도우로 검색
  for (let i = 0; i <= searchText.length - actualWindowSize; i++) {
    const windowText = searchText.substring(i, i + actualWindowSize)
    const normalizedWindow = normalizeText(windowText, { removeSpaces: true })

    const similarity = calculateSimilarity(normalizedRecognized, normalizedWindow)

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity
      bestMatch = {
        position: searchStart + i,
        confidence: similarity,
        matchedText: windowText,
      }
    }
  }

  // 신뢰도 임계값 체크
  if (bestMatch && bestMatch.confidence < 0.4) {
    return null
  }

  return bestMatch
}

/**
 * 줄 기반 매칭 - 어떤 줄에서 매칭되는지 찾기
 * 방향별 차등 임계값과 전진 편향을 적용하여 자연스러운 진행 유도
 */
export const findMatchingLine = (
  lines: string[],
  recognizedText: string,
  currentLine: number = 0,
  searchLineRange: number = 5,
  options: Partial<FindMatchingLineOptions> = {}
): LineMatchResult | null => {
  const {
    forwardBias = 0.1,       // 전진 보너스
    backwardThreshold = 0.7, // 이전 줄 이동 임계값 (높음)
    forwardThreshold = 0.4,  // 다음 줄 이동 임계값 (낮음)
  } = options

  if (!recognizedText.trim() || lines.length === 0) {
    return null
  }

  const normalizedRecognized = normalizeText(recognizedText)

  if (normalizedRecognized.length < 2) {
    return null
  }

  // 검색 범위 계산
  const startLine = Math.max(0, currentLine - searchLineRange)
  const endLine = Math.min(lines.length, currentLine + searchLineRange + 1)

  let bestMatch: LineMatchResult | null = null
  let bestAdjustedSimilarity = 0

  for (let i = startLine; i < endLine; i++) {
    const normalizedLine = normalizeText(lines[i])

    if (normalizedLine.length === 0) continue

    // 줄 전체와 비교
    const similarity = calculateSimilarity(normalizedRecognized, normalizedLine)

    // 또는 줄에 인식된 텍스트가 포함되어 있는지 확인
    const containsSimilarity = normalizedLine.includes(normalizedRecognized) ? 0.9 : 0

    const baseSimilarity = Math.max(similarity, containsSimilarity)

    // 방향 결정
    const direction: 'forward' | 'backward' | 'same' =
      i > currentLine ? 'forward' :
      i < currentLine ? 'backward' : 'same'

    // 방향별 임계값 체크
    if (direction === 'backward' && baseSimilarity < backwardThreshold) {
      continue // 이전 줄은 높은 유사도 필요
    }
    if (direction === 'forward' && baseSimilarity < forwardThreshold) {
      continue // 다음 줄은 낮은 임계값
    }

    // 전진 보너스 적용 (다음 줄에 유리하게)
    const adjustedSimilarity = direction === 'forward'
      ? baseSimilarity + forwardBias
      : baseSimilarity

    if (adjustedSimilarity > bestAdjustedSimilarity) {
      bestAdjustedSimilarity = adjustedSimilarity
      bestMatch = {
        lineIndex: i,
        confidence: baseSimilarity, // 원본 유사도 저장
        direction,
      }
    }
  }

  return bestMatch
}

/**
 * 연속 매칭 - 여러 번의 인식 결과를 누적하여 매칭
 */
export class ContinuousMatcher {
  private buffer: string[] = []
  private maxBufferSize = 5
  private lastPosition = 0

  addRecognition(text: string): void {
    if (text.trim()) {
      this.buffer.push(text.trim())
      if (this.buffer.length > this.maxBufferSize) {
        this.buffer.shift()
      }
    }
  }

  getCombinedText(): string {
    return this.buffer.join(' ')
  }

  clear(): void {
    this.buffer = []
  }

  setLastPosition(position: number): void {
    this.lastPosition = position
  }

  getLastPosition(): number {
    return this.lastPosition
  }

  findMatch(scriptText: string, searchRange: number = 500): MatchResult | null {
    const combined = this.getCombinedText()
    if (!combined) return null

    const result = findBestMatch(
      scriptText,
      combined,
      this.lastPosition,
      searchRange
    )

    if (result && result.confidence > 0.6) {
      this.lastPosition = result.position
      // 성공적인 매칭 후 버퍼 일부 정리
      if (this.buffer.length > 2) {
        this.buffer = this.buffer.slice(-2)
      }
    }

    return result
  }
}

/**
 * Prefix 매칭 길이 계산 (허용 오차 포함)
 */
const findPrefixMatch = (
  lineText: string,
  recognizedText: string,
  allowedErrors: number = 2
): number => {
  let matched = 0
  let errors = 0
  let li = 0
  let ri = 0

  while (li < lineText.length && ri < recognizedText.length) {
    if (lineText[li] === recognizedText[ri]) {
      matched++
      li++
      ri++
    } else {
      errors++
      if (errors > allowedErrors) break
      // 스킵 시도
      if (lineText[li + 1] === recognizedText[ri]) {
        li++
      } else if (lineText[li] === recognizedText[ri + 1]) {
        ri++
      } else {
        li++
        ri++
      }
    }
  }

  return matched >= 3 ? matched : 0
}

/**
 * 현재 줄의 읽기 진행도 계산
 *
 * 연속 발화 시 (예: "안녕하세요 프롬프트 테스트 중입니다")
 * 이전 줄 + 현재 줄이 한 번에 인식되면 현재 줄이 인식 텍스트에 포함됨.
 * 이를 감지하기 위해 Prefix 매칭과 부분 문자열 포함 검사를 모두 수행.
 */
export const calculateLineProgress = (
  lineText: string,
  recognizedText: string
): LineProgressResult => {
  const normLine = normalizeText(lineText, { removeSpaces: true })
  const normRecognized = normalizeText(recognizedText, { removeSpaces: true })

  if (normLine.length === 0) {
    return { progress: 1.0, matchedLength: 0, totalLength: 0 }
  }
  if (normRecognized.length === 0) {
    return { progress: 0, matchedLength: 0, totalLength: normLine.length }
  }

  // 1. Prefix 매칭 (기존 방식)
  const prefixMatched = findPrefixMatch(normLine, normRecognized)
  const prefixProgress = prefixMatched / normLine.length

  // 2. 부분 문자열 포함 검사 (새로 추가)
  // 인식 텍스트에 현재 줄이 포함되어 있으면 100% 진행
  let containsProgress = 0
  if (normRecognized.includes(normLine)) {
    containsProgress = 1.0
  } else {
    // 줄의 앞부분(70% 이상)이 인식 텍스트 끝에 포함되어 있는지 확인
    const minMatchLength = Math.ceil(normLine.length * 0.7)
    for (let len = normLine.length; len >= minMatchLength; len--) {
      const linePrefix = normLine.substring(0, len)
      if (normRecognized.endsWith(linePrefix)) {
        containsProgress = len / normLine.length
        break
      }
    }
  }

  // 3. 더 높은 진행도 사용
  const finalProgress = Math.max(prefixProgress, containsProgress)
  const matchedLength = Math.round(finalProgress * normLine.length)

  return {
    progress: finalProgress,
    matchedLength,
    totalLength: normLine.length,
  }
}
