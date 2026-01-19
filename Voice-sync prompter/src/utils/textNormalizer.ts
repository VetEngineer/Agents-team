/**
 * 텍스트 정규화 유틸리티
 * 음성 인식 결과와 대본 텍스트를 비교하기 전에 전처리
 */

// 한글 숫자 매핑
const koreanNumbers: Record<string, string> = {
  '0': '영',
  '1': '일',
  '2': '이',
  '3': '삼',
  '4': '사',
  '5': '오',
  '6': '육',
  '7': '칠',
  '8': '팔',
  '9': '구',
  '10': '십',
  '100': '백',
  '1000': '천',
  '10000': '만',
}

// 숫자를 한글로 변환 (단순 변환)
const numberToKorean = (num: string): string => {
  return num.split('').map(digit => koreanNumbers[digit] || digit).join('')
}

/**
 * 텍스트 정규화
 * - 소문자 변환
 * - 특수문자 제거
 * - 연속 공백 정리
 * - 숫자 → 한글 변환 (옵션)
 */
export const normalizeText = (text: string, options: {
  convertNumbers?: boolean
  removeSpaces?: boolean
} = {}): string => {
  let normalized = text.toLowerCase()

  // 특수문자 제거 (한글, 영문, 숫자, 공백만 유지)
  normalized = normalized.replace(/[^\p{L}\p{N}\s]/gu, '')

  // 연속 공백 → 단일 공백
  normalized = normalized.replace(/\s+/g, ' ')

  // 앞뒤 공백 제거
  normalized = normalized.trim()

  // 숫자 → 한글 변환
  if (options.convertNumbers) {
    normalized = normalized.replace(/\d+/g, (match) => numberToKorean(match))
  }

  // 모든 공백 제거 (더 공격적인 매칭용)
  if (options.removeSpaces) {
    normalized = normalized.replace(/\s/g, '')
  }

  return normalized
}

/**
 * 텍스트를 토큰 배열로 분리
 */
export const tokenize = (text: string): string[] => {
  return normalizeText(text)
    .split(/\s+/)
    .filter(token => token.length > 0)
}

/**
 * 두 텍스트의 토큰 기반 유사도 계산 (Jaccard Index)
 */
export const tokenSimilarity = (text1: string, text2: string): number => {
  const tokens1 = new Set(tokenize(text1))
  const tokens2 = new Set(tokenize(text2))

  if (tokens1.size === 0 && tokens2.size === 0) return 1
  if (tokens1.size === 0 || tokens2.size === 0) return 0

  const intersection = new Set([...tokens1].filter(t => tokens2.has(t)))
  const union = new Set([...tokens1, ...tokens2])

  return intersection.size / union.size
}
