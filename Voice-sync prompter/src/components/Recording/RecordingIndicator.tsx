import { Circle, Pause, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRecordingStore } from '@/store'
import { CHUNK_DURATION_SECONDS } from '@/types/whisper'

// 시간을 MM:SS 형식으로 포맷
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 시간을 HH:MM:SS 형식으로 포맷
const formatTimeWithHours = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

interface RecordingIndicatorProps {
  className?: string
  showChunkInfo?: boolean
}

export const RecordingIndicator = ({
  className,
  showChunkInfo = true
}: RecordingIndicatorProps) => {
  const {
    status,
    currentChunkIndex,
    currentChunkDuration,
    totalDuration,
    completedChunks,
    processingChunks,
  } = useRecordingStore()

  if (status === 'idle') return null

  const isRecording = status === 'recording'
  const isPaused = status === 'paused'
  const isProcessing = status === 'processing'

  // 청크 진행률 계산
  const chunkProgress = (currentChunkDuration / CHUNK_DURATION_SECONDS) * 100

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* 녹음 상태 표시 */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm",
        isRecording && "bg-red-500/20",
        isPaused && "bg-yellow-500/20",
        isProcessing && "bg-blue-500/20"
      )}>
        {isRecording && (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <Circle className="relative w-2.5 h-2.5 fill-red-500 text-red-500" />
            </span>
            <span className="text-red-500 font-medium">REC</span>
          </>
        )}
        {isPaused && (
          <>
            <Pause className="w-3 h-3 text-yellow-500" />
            <span className="text-yellow-500 font-medium">일시정지</span>
          </>
        )}
        {isProcessing && (
          <>
            <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
            <span className="text-blue-500 font-medium">처리 중</span>
          </>
        )}
      </div>

      {/* 전체 녹음 시간 */}
      <div className="text-sm font-mono">
        {formatTimeWithHours(totalDuration)}
      </div>

      {/* 청크 정보 (선택적) */}
      {showChunkInfo && (isRecording || isPaused) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>청크 {currentChunkIndex + 1}</span>
          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-100"
              style={{ width: `${Math.min(chunkProgress, 100)}%` }}
            />
          </div>
          <span>{formatTime(currentChunkDuration)}/10:00</span>
        </div>
      )}

      {/* 처리 상태 (API 호출 중) */}
      {(processingChunks > 0 || completedChunks > 0) && (
        <div className="flex items-center gap-2 text-xs">
          {processingChunks > 0 && (
            <span className="text-blue-500">
              처리 중: {processingChunks}
            </span>
          )}
          {completedChunks > 0 && (
            <span className="text-green-500">
              완료: {completedChunks}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
