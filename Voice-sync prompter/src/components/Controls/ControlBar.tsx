import {
  Mic,
  MicOff,
  Play,
  Pause,
  Settings,
  Edit3,
  Monitor,
  Sun,
  Moon,
  FlipHorizontal,
  AlertCircle,
  Loader2,
  Circle,
  Square,
  Download,
} from 'lucide-react'
import { useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  useSettingsStore,
  useRecognitionStore,
  useScriptStore,
  useRecordingStore,
  useSubtitleSettingsStore,
} from '@/store'
import { useSpeechRecognition, useChunkedRecorder, useWhisperPipeline } from '@/hooks'
import { generateSrt, downloadSrt, mergeAudioChunks, downloadAudio } from '@/utils/srtGenerator'
import { cn } from '@/lib/utils'

interface ControlBarProps {
  onSettingsClick: () => void
}

// 상태별 텍스트와 색상
const STATUS_CONFIG = {
  idle: { text: '대기 중', color: 'text-muted-foreground', bgColor: 'bg-muted' },
  requesting: { text: '권한 요청 중', color: 'text-blue-500', bgColor: 'bg-blue-500/20' },
  listening: { text: '듣는 중', color: 'text-green-500', bgColor: 'bg-green-500/20' },
  processing: { text: '처리 중', color: 'text-yellow-500', bgColor: 'bg-yellow-500/20' },
  error: { text: '오류', color: 'text-red-500', bgColor: 'bg-red-500/20' },
}

// 시간 포맷 함수
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export const ControlBar = ({ onSettingsClick }: ControlBarProps) => {
  const { viewMode, setViewMode, theme, toggleTheme, mirrorMode, setMirrorMode, autoScrollEnabled, setAutoScrollEnabled } = useSettingsStore()
  const { status, isSupported, errorMessage, interimText } = useRecognitionStore()
  const { text, currentLine, lines } = useScriptStore()
  const {
    status: recordingStatus,
    totalDuration,
    currentChunkIndex,
    currentChunkDuration,
    completedChunks,
    processingChunks,
    mergedSegments,
    srtReady,
    errorMessage: recordingError,
    chunks,
    mergedAudioBlob,
    audioReady,
    setMergedAudioBlob,
    setAudioReady,
    setStatus: setRecordingStatus,
  } = useRecordingStore()
  const { maxCharsPerLine, linesPerSubtitle, openaiApiKey } = useSubtitleSettingsStore()

  const { startListening, stopListening } = useSpeechRecognition({})
  const { startRecording, stopRecording } = useChunkedRecorder({
    onChunkComplete: (chunk) => {
      // 청크 완료 시 백그라운드에서 API 호출
      processChunk(chunk)
    }
  })
  const { processChunk, processAllChunks, finalizeAndMerge } = useWhisperPipeline()

  // status가 'listening' 또는 'requesting'이면 활성 상태로 간주
  const isActive = status === 'listening' || status === 'requesting'
  const isRecordingActive = recordingStatus === 'recording' || recordingStatus === 'paused'
  const isProcessingRecording = recordingStatus === 'processing'
  const hasApiKey = openaiApiKey && openaiApiKey.length > 0

  const handleMicToggle = () => {
    if (isActive) {
      stopListening()
    } else {
      startListening()
    }
  }

  // 녹음 시작/중지
  const handleRecordToggle = useCallback(async () => {
    if (isRecordingActive) {
      // 녹음 중지 → 청크 병합 → API 키 유무에 따라 분기
      const lastChunk = await stopRecording()

      // 모든 청크 수집 (마지막 청크 포함)
      const allChunks = lastChunk ? [...chunks, lastChunk] : chunks

      if (allChunks.length > 0) {
        // 오디오 청크 병합
        const mergedBlob = mergeAudioChunks(allChunks)
        setMergedAudioBlob(mergedBlob)
        setAudioReady(true)

        // API 키가 있으면 Whisper API 호출
        if (hasApiKey) {
          if (lastChunk) {
            await processChunk(lastChunk)
          }
          // 남은 청크 처리
          await processAllChunks()
          // 최종 병합
          finalizeAndMerge()
        } else {
          // API 키 없으면 바로 완료 상태로 전환
          setRecordingStatus('completed')
        }
      }

    } else {
      // 녹음 시작 (음성 인식도 같이 시작)
      if (!isActive) {
        startListening()
      }
      await startRecording()
    }
  }, [isRecordingActive, isActive, stopRecording, processChunk, processAllChunks, finalizeAndMerge, startListening, startRecording, chunks, hasApiKey, setMergedAudioBlob, setAudioReady, setRecordingStatus])

  // SRT 다운로드
  const handleDownloadSrt = useCallback(() => {
    if (mergedSegments.length === 0) return

    const srtContent = generateSrt(mergedSegments, maxCharsPerLine, linesPerSubtitle)
    const timestamp = new Date().toISOString().slice(0, 10)
    downloadSrt(srtContent, `subtitle_${timestamp}.srt`)
  }, [mergedSegments, maxCharsPerLine, linesPerSubtitle])

  // 오디오 다운로드
  const handleDownloadAudio = useCallback(() => {
    if (!mergedAudioBlob) return

    const timestamp = new Date().toISOString().slice(0, 10)
    downloadAudio(mergedAudioBlob, `recording_${timestamp}.webm`)
  }, [mergedAudioBlob])

  const statusConfig = STATUS_CONFIG[status]

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* 메인 컨트롤 바 */}
      <div className="h-14 px-4 flex items-center justify-between">
        {/* 왼쪽: 로고 및 뷰 전환 */}
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-lg">VSP</h1>

          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <Button
              variant={viewMode === 'edit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('edit')}
              className="gap-2"
            >
              <Edit3 className="w-4 h-4" />
              편집
            </Button>
            <Button
              variant={viewMode === 'prompter' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('prompter')}
              className="gap-2"
              disabled={!text.trim()}
            >
              <Monitor className="w-4 h-4" />
              프롬프터
            </Button>
          </div>
        </div>

        {/* 중앙: 음성 인식 컨트롤 */}
        <div className="flex items-center gap-3">
          {viewMode === 'prompter' && (
            <>
              {/* 마이크 버튼 (음성 인식) */}
              <Button
                variant={isActive ? 'destructive' : 'default'}
                size="default"
                onClick={handleMicToggle}
                disabled={!isSupported || status === 'requesting'}
                className={cn(
                  "gap-2 min-w-[100px]",
                  status === 'listening' && "animate-pulse"
                )}
              >
                {isActive ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    중지
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    시작
                  </>
                )}
              </Button>

              {/* 녹음 버튼 */}
              <Button
                variant={isRecordingActive ? 'destructive' : 'outline'}
                size="default"
                onClick={handleRecordToggle}
                disabled={isProcessingRecording}
                className={cn(
                  "gap-2 min-w-[120px]",
                  isRecordingActive && "animate-pulse"
                )}
              >
                {isProcessingRecording ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    처리 중
                  </>
                ) : isRecordingActive ? (
                  <>
                    <Square className="w-4 h-4 fill-current" />
                    녹음 중지
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 fill-red-500 text-red-500" />
                    녹음 시작
                  </>
                )}
              </Button>

              {/* SRT 다운로드 버튼 */}
              {srtReady && mergedSegments.length > 0 && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleDownloadSrt}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  SRT 다운로드
                </Button>
              )}

              {/* 오디오 다운로드 버튼 */}
              {audioReady && mergedAudioBlob && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={handleDownloadAudio}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  오디오 다운로드
                </Button>
              )}

              {/* 상태 인디케이터 */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
                statusConfig.bgColor
              )}>
                {status === 'requesting' && (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                )}
                {status === 'listening' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                )}
                {status === 'processing' && (
                  <Loader2 className="w-3 h-3 animate-spin" />
                )}
                {status === 'error' && (
                  <AlertCircle className="w-3 h-3" />
                )}
                <span className={statusConfig.color}>{statusConfig.text}</span>
              </div>

              {/* 진행 상태 */}
              <span className="text-sm text-muted-foreground">
                {currentLine + 1} / {lines.length}
              </span>
            </>
          )}
        </div>

        {/* 오른쪽: 설정 버튼들 */}
        <div className="flex items-center gap-2">
          {viewMode === 'prompter' && (
            <>
              <Button
                variant={autoScrollEnabled ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setAutoScrollEnabled(!autoScrollEnabled)}
                className={cn(
                  "gap-1",
                  !autoScrollEnabled && "text-muted-foreground"
                )}
                title={autoScrollEnabled ? "자동 스크롤 켜짐" : "자동 스크롤 꺼짐"}
              >
                {autoScrollEnabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                <span className="text-xs">{autoScrollEnabled ? '중지' : '시작'}</span>
              </Button>

              <Button
                variant={mirrorMode ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setMirrorMode(!mirrorMode)}
                title="미러 모드"
              >
                <FlipHorizontal className="w-4 h-4" />
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'dark' ? '라이트 모드' : '다크 모드'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            title="설정"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 음성 인식 상태 바 (프롬프터 모드에서만) */}
      {viewMode === 'prompter' && (
        <div className="h-8 px-4 flex items-center gap-4 border-t border-border/50 bg-muted/30 text-xs">
          {/* 녹음 상태 */}
          {isRecordingActive && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <Circle className="relative w-2 h-2 fill-red-500 text-red-500" />
              </span>
              <span className="text-red-500 font-medium">REC</span>
              <span className="text-muted-foreground">{formatTime(totalDuration)}</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-muted-foreground">청크 {currentChunkIndex + 1}</span>
              <span className="text-muted-foreground">({formatTime(currentChunkDuration)}/10:00)</span>
            </div>
          )}

          {/* API 처리 상태 */}
          {(processingChunks > 0 || completedChunks > 0) && (
            <div className="flex items-center gap-2">
              {processingChunks > 0 && (
                <span className="text-blue-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  처리 중: {processingChunks}
                </span>
              )}
              {completedChunks > 0 && (
                <span className="text-green-500">완료: {completedChunks}</span>
              )}
            </div>
          )}

          {/* 에러 메시지 */}
          {(errorMessage || recordingError) && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertCircle className="w-3 h-3" />
              <span>{errorMessage || recordingError}</span>
            </div>
          )}

          {/* 실시간 인식 텍스트 */}
          {status === 'listening' && !errorMessage && !recordingError && (
            <div className="flex-1 flex items-center gap-2 overflow-hidden">
              <span className="text-muted-foreground shrink-0">인식:</span>
              <span className={cn(
                "truncate",
                interimText ? "text-foreground" : "text-muted-foreground italic"
              )}>
                {interimText || "말씀해 주세요..."}
              </span>
            </div>
          )}

          {/* 지원 여부 */}
          {!isSupported && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertCircle className="w-3 h-3" />
              <span>이 브라우저는 음성 인식을 지원하지 않습니다 (Chrome/Edge 권장)</span>
            </div>
          )}

          {/* 권한 요청 중 안내 */}
          {status === 'requesting' && (
            <div className="flex items-center gap-2 text-blue-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>마이크 권한을 요청하고 있습니다...</span>
            </div>
          )}

          {/* 대기 상태 안내 */}
          {status === 'idle' && isSupported && !errorMessage && !recordingError && !isRecordingActive && (
            <span className="text-muted-foreground">
              '시작' 버튼을 눌러 음성 인식을 시작하세요 {!hasApiKey && '| 자막 생성은 설정에서 API 키를 입력하세요'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
