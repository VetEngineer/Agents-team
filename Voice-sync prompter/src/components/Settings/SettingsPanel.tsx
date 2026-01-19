import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { useSettingsStore } from '@/store'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
}

const HIGHLIGHT_COLORS = [
  { name: '노랑', value: '#fbbf24' },
  { name: '초록', value: '#34d399' },
  { name: '파랑', value: '#60a5fa' },
  { name: '보라', value: '#a78bfa' },
  { name: '분홍', value: '#f472b6' },
  { name: '빨강', value: '#f87171' },
]

export const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const {
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    scrollSpeed,
    setScrollSpeed,
    highlightColor,
    setHighlightColor,
  } = useSettingsStore()

  if (!isOpen) return null

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* 설정 패널 */}
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-background border-l border-border z-50 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-semibold text-lg">설정</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100%-60px)]">
          {/* 폰트 크기 */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm font-medium">폰트 크기</label>
              <span className="text-sm text-muted-foreground">{fontSize}px</span>
            </div>
            <Slider
              value={fontSize}
              onChange={setFontSize}
              min={16}
              max={72}
              step={2}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>16px</span>
              <span>72px</span>
            </div>
          </div>

          {/* 줄 간격 */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm font-medium">줄 간격</label>
              <span className="text-sm text-muted-foreground">{lineHeight.toFixed(1)}</span>
            </div>
            <Slider
              value={lineHeight * 10}
              onChange={(v) => setLineHeight(v / 10)}
              min={10}
              max={30}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1.0</span>
              <span>3.0</span>
            </div>
          </div>

          {/* 스크롤 속도 */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <label className="text-sm font-medium">스크롤 속도</label>
              <span className="text-sm text-muted-foreground">{scrollSpeed}</span>
            </div>
            <Slider
              value={scrollSpeed}
              onChange={setScrollSpeed}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>느림</span>
              <span>빠름</span>
            </div>
          </div>

          {/* 하이라이트 색상 */}
          <div className="space-y-3">
            <label className="text-sm font-medium">하이라이트 색상</label>
            <div className="flex gap-2 flex-wrap">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setHighlightColor(color.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    highlightColor === color.value ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* 안내 문구 */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-medium mb-2">단축키</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>↑ / ↓</span>
                <span>줄 이동</span>
              </div>
              <div className="flex justify-between">
                <span>Home / End</span>
                <span>처음 / 끝으로</span>
              </div>
            </div>
          </div>

          {/* 브라우저 호환성 안내 */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-medium mb-2">음성 인식 안내</h3>
            <p className="text-xs text-muted-foreground">
              음성 인식은 Chrome 또는 Edge 브라우저에서 가장 잘 동작합니다.
              마이크 권한을 허용해주세요.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
