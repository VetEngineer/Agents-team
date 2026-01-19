import { useCallback, useEffect, useRef, useState } from 'react'
import { useScriptStore, useSettingsStore, useRecognitionStore } from '@/store'
import { ContinuousMatcher, findMatchingLine, calculateLineProgress } from '@/utils'

interface UseAutoScrollOptions {
  scrollContainerRef: React.RefObject<HTMLElement>
  lineRefs?: React.MutableRefObject<(HTMLElement | null)[]>
}

export const useAutoScroll = ({ scrollContainerRef, lineRefs }: UseAutoScrollOptions) => {
  const { text, lines, currentLine, setCurrentLine, setCurrentPosition, setConfidence } = useScriptStore()
  const { autoScrollEnabled } = useSettingsStore()
  const { interimText, finalText, status } = useRecognitionStore()

  const [isManualScrolling, setIsManualScrolling] = useState(false)
  const manualScrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const matcherRef = useRef(new ContinuousMatcher())
  const lastProcessedTextRef = useRef('')

  // 수동 스크롤 감지
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    let scrollTimeout: ReturnType<typeof setTimeout>

    const handleScroll = () => {
      // 수동 스크롤 감지 시 자동 스크롤 일시 중지
      setIsManualScrolling(true)

      // 이전 타이머 취소
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current)
      }

      // 3초 후 자동 스크롤 재개
      manualScrollTimeoutRef.current = setTimeout(() => {
        setIsManualScrolling(false)
      }, 3000)
    }

    const handleWheel = () => {
      handleScroll()
    }

    const handleTouchMove = () => {
      handleScroll()
    }

    container.addEventListener('wheel', handleWheel, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchmove', handleTouchMove)
      if (scrollTimeout) clearTimeout(scrollTimeout)
      if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current)
    }
  }, [scrollContainerRef])

  // 특정 줄로 스크롤
  const scrollToLine = useCallback((lineIndex: number, smooth: boolean = true) => {
    if (!scrollContainerRef.current || !lineRefs?.current) return

    const lineElement = lineRefs.current[lineIndex]
    if (!lineElement) return

    const container = scrollContainerRef.current
    const containerHeight = container.clientHeight
    const lineTop = lineElement.offsetTop
    const lineHeight = lineElement.clientHeight

    // 줄을 컨테이너의 상단 1/3 위치에 표시
    const targetScrollTop = lineTop - containerHeight / 3 + lineHeight / 2

    container.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [scrollContainerRef, lineRefs])

  // 음성 인식 결과 처리 및 매칭
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[VSP-AutoScroll] Status:', status, 'AutoScroll:', autoScrollEnabled, 'ManualScrolling:', isManualScrolling)
    }

    if (!autoScrollEnabled || isManualScrolling) return
    // status가 'listening' 또는 'requesting'일 때 처리 (status 체크 완화)
    if (status !== 'listening' && status !== 'requesting') return

    const currentLineText = lines[currentLine] || ''

    // 빈 줄이면 자동으로 다음 줄로 이동 (textToProcess 체크 전에 실행하여 음성 입력 없이도 동작)
    if (currentLineText.trim() === '') {
      let nextLine = currentLine + 1
      // 연속된 빈 줄 건너뛰기
      while (nextLine < lines.length && lines[nextLine].trim() === '') {
        nextLine++
      }
      if (nextLine < lines.length) {
        setCurrentLine(nextLine)
        // 줄 위치를 문자 위치로 변환
        let charPosition = 0
        for (let i = 0; i < nextLine; i++) {
          charPosition += lines[i].length + 1
        }
        setCurrentPosition(charPosition)
        scrollToLine(nextLine)
      }
      return
    }

    // 중간 결과 또는 최종 결과 처리 (interimText 우선: 새 음성 입력 즉시 반영)
    const textToProcess = interimText || finalText
    if (!textToProcess || textToProcess === lastProcessedTextRef.current) return

    // 1. 현재 줄 진행도 계산
    const progress = calculateLineProgress(currentLineText, textToProcess)

    if (import.meta.env.DEV) {
      console.log('[VSP] Progress:', progress.progress.toFixed(2), 'Line:', currentLine, 'Text:', textToProcess)
    }

    // 2. 진행도 임계값 결정 (짧은 줄은 80%, 일반 줄은 90%)
    const THRESHOLD = currentLineText.length <= 10 ? 0.8 : 0.9

    // 3. 진행도가 임계값 이상이면 다음 줄로 이동
    if (progress.progress >= THRESHOLD) {
      const nextLine = currentLine + 1
      if (nextLine < lines.length) {
        setCurrentLine(nextLine)
        setConfidence(progress.progress)

        // 줄 위치를 문자 위치로 변환
        let charPosition = 0
        for (let i = 0; i < nextLine; i++) {
          charPosition += lines[i].length + 1 // +1 for newline
        }
        setCurrentPosition(charPosition)

        // 스크롤
        scrollToLine(nextLine)

        // 현재 텍스트 유지하여 무한 루프 방지 (새 음성 입력 시 textToProcess가 바뀌므로 정상 처리됨)
        lastProcessedTextRef.current = textToProcess
        return
      }
    }

    // 4. 진행도가 낮으면 줄 점프 체크 (기존 로직)
    if (progress.progress < 0.3) {
      const lineMatch = findMatchingLine(lines, textToProcess, currentLine, 5)

      if (lineMatch && lineMatch.confidence > 0.4 && lineMatch.lineIndex !== currentLine) {
        setCurrentLine(lineMatch.lineIndex)
        setConfidence(lineMatch.confidence)

        // 줄 위치를 문자 위치로 변환
        let charPosition = 0
        for (let i = 0; i < lineMatch.lineIndex; i++) {
          charPosition += lines[i].length + 1 // +1 for newline
        }
        setCurrentPosition(charPosition)

        // 스크롤
        scrollToLine(lineMatch.lineIndex)
        lastProcessedTextRef.current = textToProcess  // 현재 텍스트 유지하여 무한 루프 방지
      }
    }

  }, [
    autoScrollEnabled,
    isManualScrolling,
    status,
    interimText,
    finalText,
    text,
    lines,
    currentLine,
    setCurrentLine,
    setCurrentPosition,
    setConfidence,
    scrollToLine,
  ])

  // 매처 리셋
  const resetMatcher = useCallback(() => {
    matcherRef.current.clear()
    lastProcessedTextRef.current = ''
  }, [])

  // 특정 줄로 강제 이동
  const goToLine = useCallback((lineIndex: number) => {
    const validIndex = Math.max(0, Math.min(lines.length - 1, lineIndex))
    setCurrentLine(validIndex)
    matcherRef.current.setLastPosition(0)

    // 문자 위치 계산
    let charPosition = 0
    for (let i = 0; i < validIndex; i++) {
      charPosition += lines[i].length + 1
    }
    setCurrentPosition(charPosition)

    scrollToLine(validIndex, false)
  }, [lines, setCurrentLine, setCurrentPosition, scrollToLine])

  // 다음 줄로 이동
  const goToNextLine = useCallback(() => {
    if (currentLine < lines.length - 1) {
      goToLine(currentLine + 1)
    }
  }, [currentLine, lines.length, goToLine])

  // 이전 줄로 이동
  const goToPrevLine = useCallback(() => {
    if (currentLine > 0) {
      goToLine(currentLine - 1)
    }
  }, [currentLine, goToLine])

  return {
    currentLine,
    isManualScrolling,
    scrollToLine,
    goToLine,
    goToNextLine,
    goToPrevLine,
    resetMatcher,
  }
}
