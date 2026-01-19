import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/store'
import { ScriptEditor } from '@/components/Editor/ScriptEditor'
import { PrompterView } from '@/components/Prompter/PrompterView'
import { ControlBar } from '@/components/Controls/ControlBar'
import { SettingsPanel } from '@/components/Settings/SettingsPanel'

function App() {
  const { theme, viewMode } = useSettingsStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // 테마 적용
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* 상단 컨트롤 바 */}
      <ControlBar onSettingsClick={() => setIsSettingsOpen(true)} />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-hidden">
        {viewMode === 'edit' ? (
          <ScriptEditor />
        ) : (
          <PrompterView />
        )}
      </main>

      {/* 설정 패널 */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}

export default App
