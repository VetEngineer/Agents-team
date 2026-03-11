import { Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useSubtitleSettingsStore } from '@/store'
import { validateApiKey } from '@/utils/whisperApi'
import { cn } from '@/lib/utils'

export const SubtitleSettings = () => {
  const {
    maxCharsPerLine,
    setMaxCharsPerLine,
    linesPerSubtitle,
    setLinesPerSubtitle,
    openaiApiKey,
    setOpenaiApiKey,
    useScriptReference,
    setUseScriptReference,
  } = useSubtitleSettingsStore()

  const [showApiKey, setShowApiKey] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(openaiApiKey)

  const isValidKey = validateApiKey(apiKeyInput)
  const hasApiKey = apiKeyInput.length > 0

  const handleApiKeySave = () => {
    setOpenaiApiKey(apiKeyInput)
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium border-b border-border pb-2">자막 설정</h3>

      {/* OpenAI API 키 */}
      <div className="space-y-3">
        <label className="text-sm font-medium">OpenAI API 키</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder="sk-..."
              className={cn(
                "w-full px-3 py-2 text-sm rounded-md border bg-background pr-10",
                hasApiKey && !isValidKey && "border-destructive",
                hasApiKey && isValidKey && "border-green-500"
              )}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button
            size="sm"
            onClick={handleApiKeySave}
            disabled={!isValidKey || apiKeyInput === openaiApiKey}
          >
            저장
          </Button>
        </div>
        {hasApiKey && !isValidKey && (
          <p className="text-xs text-destructive">유효한 API 키 형식이 아닙니다 (sk-로 시작해야 합니다)</p>
        )}

        {/* 보안 경고 */}
        <div className="flex items-start gap-2 p-2 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-500">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-xs">
            API 키는 브라우저의 로컬 스토리지에 저장됩니다. 공용 컴퓨터에서는 사용 후 키를 삭제해주세요.
          </p>
        </div>
      </div>

      {/* 한 줄 최대 글자 수 */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <label className="text-sm font-medium">한 줄 최대 글자 수</label>
          <span className="text-sm text-muted-foreground">{maxCharsPerLine}자</span>
        </div>
        <Slider
          value={maxCharsPerLine}
          onChange={setMaxCharsPerLine}
          min={15}
          max={40}
          step={1}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>15자</span>
          <span>40자</span>
        </div>
      </div>

      {/* 자막당 줄 수 */}
      <div className="space-y-3">
        <label className="text-sm font-medium">자막당 줄 수</label>
        <div className="flex gap-2">
          <Button
            variant={linesPerSubtitle === 1 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLinesPerSubtitle(1)}
            className="flex-1"
          >
            1줄
          </Button>
          <Button
            variant={linesPerSubtitle === 2 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLinesPerSubtitle(2)}
            className="flex-1"
          >
            2줄
          </Button>
        </div>
      </div>

      {/* 대본 참조 사용 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">대본 참조 사용</label>
          <button
            onClick={() => setUseScriptReference(!useScriptReference)}
            className={cn(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              useScriptReference ? "bg-primary" : "bg-secondary"
            )}
          >
            <span
              className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-background transition-transform",
                useScriptReference ? "translate-x-6" : "translate-x-1"
              )}
            />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          활성화하면 대본을 참조하여 음성 인식 정확도를 높이고 텍스트를 교정합니다.
        </p>
      </div>

      {/* 미리보기 예시 */}
      <div className="space-y-3">
        <label className="text-sm font-medium">자막 미리보기</label>
        <div className="p-4 bg-black/90 rounded-lg">
          <div className="text-white text-center text-sm leading-relaxed">
            {linesPerSubtitle === 1 ? (
              <p>{'안녕하세요 여러분'.slice(0, maxCharsPerLine)}</p>
            ) : (
              <>
                <p>{'안녕하세요 여러분'.slice(0, maxCharsPerLine)}</p>
                <p>{'오늘도 좋은 하루 되세요'.slice(0, maxCharsPerLine)}</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
