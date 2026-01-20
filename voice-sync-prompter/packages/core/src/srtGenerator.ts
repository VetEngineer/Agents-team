import type { TranscriptionSegment, SrtEntry, ChunkInfo } from './types/whisper'

// 초를 SRT 타임코드 형식으로 변환 (00:00:00,000)
export const formatSrtTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const millis = Math.round((seconds % 1) * 1000)

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`
}

// 텍스트를 지정된 글자 수로 분할
const splitTextByLength = (
  text: string,
  maxCharsPerLine: number,
  linesPerSubtitle: number
): string[] => {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word

    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine
    } else {
      if (currentLine) {
        lines.push(currentLine)
      }
      currentLine = word
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  // 줄 수 제한에 맞게 그룹화
  const grouped: string[] = []
  for (let i = 0; i < lines.length; i += linesPerSubtitle) {
    const group = lines.slice(i, i + linesPerSubtitle)
    grouped.push(group.join('\n'))
  }

  return grouped
}

// 세그먼트를 SRT 엔트리로 변환
const segmentToSrtEntries = (
  segment: TranscriptionSegment,
  startIndex: number,
  maxCharsPerLine: number,
  linesPerSubtitle: number
): SrtEntry[] => {
  const textParts = splitTextByLength(segment.text, maxCharsPerLine, linesPerSubtitle)

  if (textParts.length === 0) return []

  // 각 파트에 시간 분배
  const duration = segment.end - segment.start
  const partDuration = duration / textParts.length

  return textParts.map((text, idx) => ({
    index: startIndex + idx,
    startTime: formatSrtTime(segment.start + idx * partDuration),
    endTime: formatSrtTime(segment.start + (idx + 1) * partDuration),
    text,
  }))
}

// TranscriptionSegment 배열을 SRT 파일 내용으로 변환
export const generateSrt = (
  segments: TranscriptionSegment[],
  maxCharsPerLine: number = 25,
  linesPerSubtitle: number = 1
): string => {
  const entries: SrtEntry[] = []
  let currentIndex = 1

  for (const segment of segments) {
    if (!segment.text.trim()) continue

    const segmentEntries = segmentToSrtEntries(
      segment,
      currentIndex,
      maxCharsPerLine,
      linesPerSubtitle
    )

    entries.push(...segmentEntries)
    currentIndex += segmentEntries.length
  }

  // SRT 포맷으로 변환
  return entries.map(entry =>
    `${entry.index}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}\n`
  ).join('\n')
}

// 세그먼트 배열에서 전체 텍스트 추출
export const extractFullText = (segments: TranscriptionSegment[]): string => {
  return segments.map(s => s.text).join(' ')
}

// VTT 형식으로 변환 (웹 비디오용)
export const generateVtt = (
  segments: TranscriptionSegment[],
  maxCharsPerLine: number = 25,
  linesPerSubtitle: number = 1
): string => {
  const formatVttTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const millis = Math.round((seconds % 1) * 1000)

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
  }

  const entries: string[] = ['WEBVTT', '']

  let currentIndex = 1

  for (const segment of segments) {
    if (!segment.text.trim()) continue

    const textParts = splitTextByLength(segment.text, maxCharsPerLine, linesPerSubtitle)
    const duration = segment.end - segment.start
    const partDuration = duration / textParts.length

    for (let idx = 0; idx < textParts.length; idx++) {
      const startTime = formatVttTime(segment.start + idx * partDuration)
      const endTime = formatVttTime(segment.start + (idx + 1) * partDuration)

      entries.push(`${currentIndex}`)
      entries.push(`${startTime} --> ${endTime}`)
      entries.push(textParts[idx])
      entries.push('')

      currentIndex++
    }
  }

  return entries.join('\n')
}

// 청크 배열에서 오디오 Blob들을 병합
export const mergeAudioChunks = (chunks: ChunkInfo[]): Blob => {
  const blobs = chunks.map(chunk => chunk.blob)
  return new Blob(blobs, { type: 'audio/webm' })
}
