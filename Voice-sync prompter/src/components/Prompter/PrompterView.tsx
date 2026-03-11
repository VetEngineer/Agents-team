import { useRef, useEffect, useState, useMemo } from 'react'
import { useScriptStore, useSettingsStore, useRecognitionStore, useRecordingStore, useSubtitleSettingsStore } from '@/store'
import { useAutoScroll } from '@/hooks'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronUp, Info, Loader2, AlertCircle, Circle } from 'lucide-react'
import { RecordingIndicator } from '@/components/Recording/RecordingIndicator'
import type { TranscriptionSegment } from '@/types/whisper'

// 현재 시간 기준으로 활성 자막 세그먼트 찾기
const findActiveSegment = (
  segments: TranscriptionSegment[],
  currentTime: number
): TranscriptionSegment | null => {
  if (segments.length === 0) return null
  // 현재 시간에 해당하는 세그먼트 찾기
  for (const segment of segments) {
    if (currentTime >= segment.start && currentTime <= segment.end) {
      return segment
    }
  }
  // 없으면 가장 최근 완료된 세그먼트 반환
  const past = segments.filter(s => s.end <= currentTime)
  return past.length > 0 ? past[past.length - 1] : null
}

export const PrompterView = () => {
  const { lines, currentLine, confidence } = useScriptStore()
  const { fontSize, lineHeight, mirrorMode, highlightColor, autoScrollEnabled } = useSettingsStore()
  const { interimText, finalText, status } = useRecognitionStore()
  const {
    status: recordingStatus,
    totalDuration,
    currentChunkIndex,
    mergedSegments,
    transcriptions,
    errorMessage: recordingError,
    processingChunks,
    completedChunks,
    srtReady,
  } = useRecordingStore()
  const { openaiApiKey } = useSubtitleSettingsStore()

  const [showDebug, setShowDebug] = useState(true)
  const [lastMatchInfo, setLastMatchInfo] = useState<{ text: string; line: number; confidence: number } | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const lineRefs = useRef<(HTMLDivElement | null)[]>([])

  const { isManualScrolling, goToLine, goToNextLine, goToPrevLine } = useAutoScroll({
    scrollContainerRef: scrollContainerRef as React.RefObject<HTMLElement>,
    lineRefs,
  })

  const isRecordingActive = recordingStatus === 'recording' || recordingStatus === 'paused'
  const isProcessing = recordingStatus === 'processing'
  const isCompleted = recordingStatus === 'completed'
  const isRecordingError = recordingStatus === 'error'
  const hasApiKey = openaiApiKey.length > 0

  // 실시간 자막 세그먼트 (처리 중인 트랜스크립션에서 추출)
  const liveSegments = useMemo((): TranscriptionSegment[] => {
    // 완료된 병합 세그먼트가 있으면 그것을 사용
    if (mergedSegments.length > 0) {
      return mergedSegments
    }
    // 아직 병합 전이면 개별 트랜스크립션에서 세그먼트 수집
    const completed = transcriptions.filter(t => t.status === 'completed')
    if (completed.length === 0) return []
    return completed
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .flatMap(t => t.segments)
  }, [mergedSegments, transcriptions])

  // 최신 자막 텍스트 (가장 마지막 세그먼트)
  const latestSubtitle = useMemo((): string => {
    if (liveSegments.length === 0) return ''
    const active = findActiveSegment(liveSegments, totalDuration)
    if (active) return active.text
    // fallback: 마지막 세그먼트
    return liveSegments[liveSegments.length - 1].text
  }, [liveSegments, totalDuration])

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

          {/* 녹음/Whisper 파이프라인 상태 */}
          {recordingStatus !== 'idle' && (
            <div className="pt-2 border-t border-border">
              <div className="text-muted-foreground mb-1">녹음 파이프라인:</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">녹음 상태:</span>
                  <span className={cn(
                    "font-medium",
                    isRecordingActive && "text-red-500",
                    isProcessing && "text-blue-500",
                    isCompleted && "text-green-500",
                    isRecordingError && "text-red-500"
                  )}>
                    {recordingStatus === 'recording' && '녹음 중'}
                    {recordingStatus === 'paused' && '일시정지'}
                    {recordingStatus === 'processing' && '처리 중'}
                    {recordingStatus === 'completed' && '완료'}
                    {recordingStatus === 'error' && '오류'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">청크:</span>
                  <span className="font-medium">{currentChunkIndex + 1}</span>
                </div>
                {hasApiKey && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">트랜스크립션:</span>
                    <span className="font-medium">
                      {completedChunks} 완료
                      {processingChunks > 0 && ` / ${processingChunks} 처리 중`}
                    </span>
                  </div>
                )}
                {liveSegments.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">자막 세그먼트:</span>
                    <span className="font-medium">{liveSegments.length}개</span>
                  </div>
                )}
                {!hasApiKey && (
                  <div className="text-yellow-500 text-[10px] mt-1">
                    API 키 없음 - 자막 생성 비활성
                  </div>
                )}
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

      {/* 녹음 인디케이터 (우측 상단) */}
      {recordingStatus !== 'idle' && (
        <div className="absolute top-4 right-4 z-20">
          <RecordingIndicator showChunkInfo={isRecordingActive} />
        </div>
      )}

      {/* 녹음 에러 표시 */}
      {(isRecordingError || recordingError) && (
        <div className="absolute top-16 right-4 z-20 bg-red-500/20 backdrop-blur rounded-lg px-3 py-2 text-xs text-red-500 border border-red-500/30 max-w-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>{recordingError || '녹음 중 오류가 발생했습니다'}</span>
          </div>
        </div>
      )}

      {/* Whisper 처리 상태 표시 (녹음 중지 후 API 처리) */}
      {isProcessing && processingChunks > 0 && (
        <div className="absolute top-16 right-4 z-20 bg-blue-500/20 backdrop-blur rounded-lg px-3 py-2 text-xs text-blue-500 border border-blue-500/30">
          <div className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin shrink-0" />
            <span>Whisper API 처리 중... ({completedChunks}/{completedChunks + processingChunks})</span>
          </div>
        </div>
      )}

      {/* 실시간 자막 오버레이 (하단 중앙) */}
      <div className="absolute bottom-4 left-4 right-4 z-20 space-y-2">
        {/* Whisper 파이프라인 자막 표시 */}
        {latestSubtitle && (isRecordingActive || isProcessing || isCompleted) && (
          <div className="bg-black/80 backdrop-blur rounded-lg px-5 py-3 shadow-lg">
            <div className="text-white text-center text-base leading-relaxed">
              {latestSubtitle}
            </div>
            {liveSegments.length > 1 && (
              <div className="text-center text-xs text-white/50 mt-1">
                {liveSegments.length}개 세그먼트 중 최신
              </div>
            )}
          </div>
        )}

        {/* SRT 준비 완료 알림 */}
        {srtReady && isCompleted && (
          <div className="bg-green-500/20 backdrop-blur rounded-lg px-4 py-2 shadow-lg border border-green-500/30">
            <div className="flex items-center justify-center gap-2 text-green-500 text-sm">
              <Circle className="w-2 h-2 fill-green-500" />
              <span>자막 생성 완료 - 상단 ControlBar에서 SRT를 다운로드하세요</span>
            </div>
          </div>
        )}

        {/* 음성 인식 활성 표시 */}
        {status === 'listening' && !latestSubtitle && (
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
        )}

        {/* 음성 인식 + 자막이 동시에 활성일 때 인식 텍스트 표시 */}
        {status === 'listening' && latestSubtitle && isRecordingActive && (
          <div className={cn(
            "bg-secondary/90 backdrop-blur rounded-lg px-4 py-2 shadow-lg border",
            interimText ? "border-green-500/30" : "border-border"
          )}>
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-xs truncate",
                  interimText ? "text-foreground" : "text-muted-foreground"
                )}>
                  {interimText || "음성 인식 중..."}
                </div>
              </div>
              {confidence > 0 && (
                <div className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded",
                  confidence > 0.7 && "bg-green-500/20 text-green-500",
                  confidence > 0.4 && confidence <= 0.7 && "bg-yellow-500/20 text-yellow-500",
                  confidence <= 0.4 && "bg-red-500/20 text-red-500"
                )}>
                  {(confidence * 100).toFixed(0)}%
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
