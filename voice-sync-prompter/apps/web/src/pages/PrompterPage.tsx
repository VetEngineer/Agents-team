import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, Textarea } from '@vsp/ui'
import { useScriptStore, useSettingsStore } from '@vsp/store'
import { useAuth } from '@/contexts/AuthContext'
import { ArrowLeft, Play, Pause, Settings, Eye, Edit } from 'lucide-react'

export default function PrompterPage() {
  const { scriptId } = useParams()
  const { apiClient } = useAuth()
  const { text, setText, currentLine, lines } = useScriptStore()
  const { viewMode, setViewMode, fontSize, lineHeight, mirrorMode } = useSettingsStore()
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState('새 대본')
  const [isListening, setIsListening] = useState(false)

  // Load script from API if scriptId exists
  useEffect(() => {
    const loadScript = async () => {
      if (!scriptId) return

      setIsLoading(true)
      try {
        const script = await apiClient.getScript(scriptId)
        setText(script.content)
        setTitle(script.title)
      } catch (error) {
        console.error('Failed to load script:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadScript()
  }, [scriptId, apiClient, setText])

  // Save script when text changes
  useEffect(() => {
    if (!scriptId || !text) return

    const saveTimeout = setTimeout(async () => {
      try {
        await apiClient.updateScript(scriptId, { content: text })
      } catch (error) {
        console.error('Failed to save script:', error)
      }
    }, 1000)

    return () => clearTimeout(saveTimeout)
  }, [scriptId, text, apiClient])

  const toggleListening = () => {
    setIsListening(!isListening)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b flex-shrink-0">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'edit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('edit')}
            >
              <Edit className="w-4 h-4 mr-1" />
              편집
            </Button>
            <Button
              variant={viewMode === 'prompter' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('prompter')}
            >
              <Eye className="w-4 h-4 mr-1" />
              프롬프터
            </Button>
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {viewMode === 'edit' ? (
          <div className="h-full p-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="대본을 입력하세요..."
              className="w-full h-full resize-none font-mono"
              style={{ fontSize: `${fontSize}px`, lineHeight }}
            />
          </div>
        ) : (
          <div
            className="h-full overflow-y-auto p-8"
            style={{
              transform: mirrorMode ? 'scaleX(-1)' : 'none',
            }}
          >
            <div
              className="max-w-4xl mx-auto"
              style={{ fontSize: `${fontSize}px`, lineHeight }}
            >
              {lines.map((line, index) => (
                <p
                  key={index}
                  className={`py-2 transition-colors ${
                    index === currentLine
                      ? 'text-primary font-semibold'
                      : index < currentLine
                      ? 'text-muted-foreground'
                      : ''
                  }`}
                >
                  {line || '\u00A0'}
                </p>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Controls */}
      {viewMode === 'prompter' && (
        <footer className="border-t flex-shrink-0">
          <div className="container mx-auto px-4 py-4 flex items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={toggleListening}
              variant={isListening ? 'destructive' : 'default'}
            >
              {isListening ? (
                <>
                  <Pause className="w-5 h-5 mr-2" />
                  중지
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  시작
                </>
              )}
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentLine + 1} / {lines.length} 줄
            </span>
          </div>
        </footer>
      )}
    </div>
  )
}
