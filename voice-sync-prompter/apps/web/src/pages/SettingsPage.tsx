import { Link } from 'react-router-dom'
import { Button, Slider } from '@vsp/ui'
import { useSettingsStore, useSubtitleSettingsStore } from '@vsp/store'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Moon, Sun } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuth()
  const {
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    theme,
    toggleTheme,
    scrollSpeed,
    setScrollSpeed,
    mirrorMode,
    setMirrorMode,
  } = useSettingsStore()

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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">설정</h1>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Account */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">계정</h2>
          <div className="p-4 border rounded-lg">
            <p className="text-sm text-muted-foreground">이메일</p>
            <p>{user?.email}</p>
            <p className="text-sm text-muted-foreground mt-2">플랜</p>
            <p className="capitalize">{user?.plan || 'Free'}</p>
          </div>
        </section>

        {/* Display */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">화면 설정</h2>
          <div className="space-y-6 p-4 border rounded-lg">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">테마</p>
                <p className="text-sm text-muted-foreground">
                  라이트/다크 모드
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Font Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">글꼴 크기</p>
                <span className="text-sm text-muted-foreground">{fontSize}px</span>
              </div>
              <Slider
                value={fontSize}
                onChange={setFontSize}
                min={16}
                max={72}
                step={2}
              />
            </div>

            {/* Line Height */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">줄 간격</p>
                <span className="text-sm text-muted-foreground">{lineHeight.toFixed(1)}</span>
              </div>
              <Slider
                value={lineHeight * 10}
                onChange={(v) => setLineHeight(v / 10)}
                min={10}
                max={30}
                step={1}
              />
            </div>

            {/* Scroll Speed */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">스크롤 속도</p>
                <span className="text-sm text-muted-foreground">{scrollSpeed}</span>
              </div>
              <Slider
                value={scrollSpeed}
                onChange={setScrollSpeed}
                min={1}
                max={10}
                step={1}
              />
            </div>

            {/* Mirror Mode */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">미러 모드</p>
                <p className="text-sm text-muted-foreground">
                  화면 좌우 반전 (텔레프롬프터용)
                </p>
              </div>
              <Button
                variant={mirrorMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMirrorMode(!mirrorMode)}
              >
                {mirrorMode ? '켜짐' : '꺼짐'}
              </Button>
            </div>
          </div>
        </section>

        {/* Subtitle Settings */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">자막 설정</h2>
          <div className="space-y-6 p-4 border rounded-lg">
            {/* OpenAI API Key */}
            <div>
              <p className="font-medium mb-2">OpenAI API 키</p>
              <input
                type="password"
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Whisper AI 음성 인식에 사용됩니다
              </p>
            </div>

            {/* Max Chars Per Line */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">한 줄 최대 글자 수</p>
                <span className="text-sm text-muted-foreground">{maxCharsPerLine}</span>
              </div>
              <Slider
                value={maxCharsPerLine}
                onChange={setMaxCharsPerLine}
                min={15}
                max={40}
                step={1}
              />
            </div>

            {/* Lines Per Subtitle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">자막 줄 수</p>
                <p className="text-sm text-muted-foreground">
                  자막당 표시할 줄 수
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={linesPerSubtitle === 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLinesPerSubtitle(1)}
                >
                  1줄
                </Button>
                <Button
                  variant={linesPerSubtitle === 2 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLinesPerSubtitle(2)}
                >
                  2줄
                </Button>
              </div>
            </div>

            {/* Use Script Reference */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">대본 참조 사용</p>
                <p className="text-sm text-muted-foreground">
                  음성 인식 정확도 향상
                </p>
              </div>
              <Button
                variant={useScriptReference ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUseScriptReference(!useScriptReference)}
              >
                {useScriptReference ? '켜짐' : '꺼짐'}
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
