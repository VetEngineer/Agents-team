import type { TranscriptionSegment } from './types/whisper'

// 텍스트 정규화 (비교용)
const normalizeText = (text: string): string => {
  return text
    .replace(/[^\w\s가-힣]/g, '')  // 특수문자 제거
    .replace(/\s+/g, ' ')          // 공백 정규화
    .toLowerCase()
    .trim()
}

// 단어 단위로 분리
const tokenize = (text: string): string[] => {
  return normalizeText(text).split(' ').filter(Boolean)
}

// 레벤슈타인 거리 계산
const levenshteinDistance = (a: string, b: string): number => {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

// 문자열 유사도 (0-1, 1이 완전 일치)
const similarity = (a: string, b: string): number => {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  const distance = levenshteinDistance(a, b)
  return 1 - distance / maxLen
}

// 대본에서 가장 유사한 텍스트 찾기
const findBestMatch = (
  transcribedText: string,
  scriptLines: string[],
  startLineIdx: number = 0
): { lineIdx: number; score: number; matchedText: string } | null => {
  const transcribedNorm = normalizeText(transcribedText)
  if (!transcribedNorm) return null

  let bestMatch = { lineIdx: -1, score: 0, matchedText: '' }

  // 시작 위치부터 검색 (앞으로 진행하면서)
  const searchWindow = Math.min(20, scriptLines.length - startLineIdx)

  for (let offset = 0; offset < searchWindow; offset++) {
    const lineIdx = startLineIdx + offset
    if (lineIdx >= scriptLines.length) break

    const line = scriptLines[lineIdx]
    const lineNorm = normalizeText(line)

    if (!lineNorm) continue

    // 전체 라인 유사도
    const lineSim = similarity(transcribedNorm, lineNorm)

    // 부분 매칭 (transcribed가 line의 일부일 수 있음)
    let partialSim = 0
    if (lineNorm.includes(transcribedNorm)) {
      partialSim = transcribedNorm.length / lineNorm.length
    } else if (transcribedNorm.includes(lineNorm)) {
      partialSim = lineNorm.length / transcribedNorm.length
    }

    const score = Math.max(lineSim, partialSim * 0.9)

    // 가까운 라인에 가중치
    const distancePenalty = offset * 0.02
    const adjustedScore = score - distancePenalty

    if (adjustedScore > bestMatch.score) {
      bestMatch = { lineIdx, score: adjustedScore, matchedText: line }
    }
  }

  return bestMatch.lineIdx >= 0 ? bestMatch : null
}

// 세그먼트를 대본에 정렬
export const alignSegmentsToScript = (
  segments: TranscriptionSegment[],
  script: string
): TranscriptionSegment[] => {
  const scriptLines = script.split('\n').filter(line => line.trim())

  if (scriptLines.length === 0 || segments.length === 0) {
    return segments
  }

  const alignedSegments: TranscriptionSegment[] = []
  let currentScriptLine = 0

  for (const segment of segments) {
    const match = findBestMatch(segment.text, scriptLines, currentScriptLine)

    if (match && match.score > 0.5) {
      // 대본 텍스트로 교체 (threshold 이상일 때)
      alignedSegments.push({
        ...segment,
        text: match.matchedText.trim(),
      })

      // 다음 검색 시작점 업데이트
      currentScriptLine = match.lineIdx
    } else {
      // 매칭되지 않으면 원본 유지
      alignedSegments.push(segment)
    }
  }

  return alignedSegments
}

// 세그먼트 텍스트를 대본 기반으로 교정
export const correctSegmentText = (
  segmentText: string,
  scriptContext: string,
  threshold: number = 0.6
): string => {
  const scriptWords = tokenize(scriptContext)
  const segmentWords = tokenize(segmentText)

  if (scriptWords.length === 0 || segmentWords.length === 0) {
    return segmentText
  }

  const correctedWords: string[] = []

  for (const segmentWord of segmentWords) {
    let bestMatch = { word: segmentWord, score: 0 }

    for (const scriptWord of scriptWords) {
      const sim = similarity(segmentWord, scriptWord)
      if (sim > bestMatch.score && sim > threshold) {
        bestMatch = { word: scriptWord, score: sim }
      }
    }

    correctedWords.push(bestMatch.word)
  }

  return correctedWords.join(' ')
}

// 대본 청크 추출 (Whisper prompt용)
export const extractScriptChunk = (
  script: string,
  chunkIndex: number,
  estimatedWordsPerChunk: number = 500
): string => {
  const words = script.split(/\s+/)
  const startIdx = chunkIndex * estimatedWordsPerChunk
  const endIdx = Math.min(startIdx + estimatedWordsPerChunk * 1.5, words.length)

  return words.slice(Math.max(0, startIdx - 50), endIdx).join(' ')
}
