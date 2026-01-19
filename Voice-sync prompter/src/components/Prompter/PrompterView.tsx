import { useRef, useEffect, useState } from 'react'
import { useScriptStore, useSettingsStore, useRecognitionStore } from '@/store'
import { useAutoScroll } from '@/hooks'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Info } from 'lucide-react'

export const PrompterView = () => {
  const { lines, currentLine, confidence } = useScriptStore()
  const { fontSize, lineHeight, mirrorMode, highlightColor, autoScrollEnabled } = useSettingsStore()
  const { interimText, finalText, status } = useRecognitionStore()

  const [showDebug, setShowDebug] = useState(true)
  const [lastMatchInfo, setLastMatchInfo] = useState<{ text: string; line: number; confidence: number } | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  const { isManualScrolling, goToLine, goToNextLine, goToPrevLine } = useAutoScroll({
    scrollContainerRef: scrollContainerRef as React.RefObject<HTMLElement>,
    lineRefs,
  })

  // 매칭 정보 업데이트
  useEffect(() => {
    if (finalText && confidence > 0) {
      setLastMatchInfo({
        text: finalText,
        line: currentLine,
        confidence: confidence,
      })
    }
  }, [finalText, currentLine, confidence])

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        goToNextLine()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        goToPrevLine()
      } else if (e.key === 'Home') {
        e.preventDefault()
        goToLine(0)
      } else if (e.key === 'End') {
        e.preventDefault()
        goToLine(lines.length - 1)
      } else if (e.key === 'd' && e.ctrlKey) {
        e.preventDefault()
        setShowDebug(!showDebug)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goToNextLine, goToPrevLine, goToLine, lines.length, showDebug])

  // lineRefs 배열 크기 조정
  useEffect(() => {
    lineRefs.current = lineRefs.current.slice(0, lines.length)
  }, [lines.length])

  if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-xl">대본을 입력해주세요</p>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {/* 상단 그라데이션 */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />

      {/* 스크롤 컨테이너 */}
      <div
        ref={scrollContainerRef}
        className={cn(
          "h-full overflow-y-auto prompter-scroll px-8 py-32",
          mirrorMode && "scale-x-[-1]"
        )}
      >
        <div className="max-w-4xl mx-auto">
          {lines.map((line, index) => (
            <div
              key={index}
              ref={(el) => { lineRefs.current[index] = el }}
              onClick={() => goToLine(index)}
              className={cn(
                "py-2 px-4 rounded-lg cursor-pointer transition-all duration-200",
                index === currentLine
                  ? "scale-105"
                  : "opacity-60 hover:opacity-80"
              )}
              style={{
                fontSize: `${fontSize}px`,
                lineHeight: lineHeight,
                backgroundColor: index === currentLine ? `${highlightColor}20` : 'transparent',
                borderLeft: index === currentLine ? `4px solid ${highlightColor}` : '4px solid transparent',
              }}
            >
              {line || '\u00A0'}
            </div>
          ))}
        </div>

        {/* 하단 여백 */}
        <div className="h-[50vh]" />
      </div>

      {/* 하단 그라데이션 */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />

      {/* 디버그 패널 토글 버튼 */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="absolute top-4 left-4 z-20 bg-secondary/80 backdrop-blur rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-secondary flex items-center gap-1"
      >
        <Info className="w-3 h-3" />
        {showDebug ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {/* 디버그 정보 패널 */}
      {showDebug && (
        <div className="absolute top-12 left-4 z-20 bg-secondary/90 backdrop-blur rounded-lg p-3 text-xs space-y-2 min-w-[280px] shadow-lg border border-border">
          <div className="font-semibold text-sm mb-2 pb-2 border-b border-border">음성 인식 디버그</div>

          {/* 상태 */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">상태:</span>
            <span className={cn(
              "font-medium",
              status === 'listening' && "text-green-500",
              status === 'error' && "text-red-500"
            )}>
              {status === 'idle' && '대기 중'}
              {status === 'listening' && '듣는 중'}
              {status === 'processing' && '처리 중'}
              {status === 'error' && '오류'}
            </span>
          </div>

          {/* 자동 스크롤 */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">자동 스크롤:</span>
            <span className={cn(
              "font-medium",
              autoScrollEnabled ? "text-green-500" : "text-yellow-500"
            )}>
              {autoScrollEnabled ? '켜짐' : '꺼짐'}
            </span>
          </div>

          {/* 수동 스크롤 상태 */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">수동 스크롤:</span>
            <span className={cn(
              "font-medium",
              isManualScrolling ? "text-yellow-500" : "text-muted-foreground"
            )}>
              {isManualScrolling ? '감지됨 (3초 대기)' : '없음'}
            </span>
          </div>

          {/* 현재 위치 */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">현재 줄:</span>
            <span className="font-medium">{currentLine + 1} / {lines.length}</span>
          </div>

          {/* 실시간 인식 텍스트 */}
          {status === 'listening' && (
            <div className="pt-2 border-t border-border">
              <div className="text-muted-foreground mb-1">실시간 인식:</div>
              <div className={cn(
                "p-2 bg-background/50 rounded text-sm break-words max-h-20 overflow-y-auto",
                interimText ? "text-foreground" : "text-muted-foreground italic"
              )}>
                {interimText || "(음성을 기다리는 중...)"}
              </div>
            </div>
          )}

          {/* 마지막 매칭 정보 */}
          {lastMatchInfo && (
            <div className="pt-2 border-t border-border">
              <div className="text-muted-foreground mb-1">마지막 매칭:</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">신뢰도:</span>
                  <span className={cn(
                    "font-medium",
                    lastMatchInfo.confidence > 0.7 && "text-green-500",
                    lastMatchInfo.confidence > 0.4 && lastMatchInfo.confidence <= 0.7 && "text-yellow-500",
                    lastMatchInfo.confidence <= 0.4 && "text-red-500"
                  )}>
                    {(lastMatchInfo.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="p-2 bg-background/50 rounded text-sm break-words max-h-16 overflow-y-auto">
                  "{lastMatchInfo.text}"
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 text-muted-foreground text-[10px]">
            Ctrl+D: 패널 토글
          </div>
        </div>
      )}

      {/* 수동 스크롤 표시 */}
      {isManualScrolling && !showDebug && (
        <div className="absolute top-4 right-4 z-20 bg-yellow-500/20 backdrop-blur rounded-lg px-3 py-1 text-xs text-yellow-500 border border-yellow-500/30">
          수동 스크롤 감지 - 3초 후 자동 스크롤 재개
        </div>
      )}

      {/* 음성 인식 활성 표시 (하단) */}
      {status === 'listening' && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div className={cn(
            "bg-secondary/90 backdrop-blur rounded-lg px-4 py-3 shadow-lg border",
            interimText ? "border-green-500/30" : "border-border"
          )}>
            <div className="flex items-center gap-3">
              {/* 녹음 인디케이터 */}
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>

              {/* 텍스트 */}
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-sm truncate",
                  interimText ? "text-foreground" : "text-muted-foreground"
                )}>
                  {interimText || "음성을 인식하고 있습니다..."}
                </div>
              </div>

              {/* 신뢰도 표시 */}
              {confidence > 0 && (
                <div className={cn(
                  "text-xs px-2 py-0.5 rounded",
                  confidence > 0.7 && "bg-green-500/20 text-green-500",
                  confidence > 0.4 && confidence <= 0.7 && "bg-yellow-500/20 text-yellow-500",
                  confidence <= 0.4 && "bg-red-500/20 text-red-500"
                )}>
                  {(confidence * 100).toFixed(0)}%
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
