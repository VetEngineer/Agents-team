import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SubtitleSettingsState {
  // 한 줄 최대 글자 수 (15-40)
  maxCharsPerLine: number
  // 자막당 줄 수 (1 또는 2)
  linesPerSubtitle: number
  // OpenAI API 키
  openaiApiKey: string
  // 대본 참조 사용 여부
  useScriptReference: boolean

  // Actions
  setMaxCharsPerLine: (chars: number) => void
  setLinesPerSubtitle: (lines: number) => void
  setOpenaiApiKey: (key: string) => void
  setUseScriptReference: (use: boolean) => void
}

export const useSubtitleSettingsStore = create<SubtitleSettingsState>()(
  persist(
    (set) => ({
      maxCharsPerLine: 25,
      linesPerSubtitle: 1,
      openaiApiKey: '',
      useScriptReference: true,

      setMaxCharsPerLine: (maxCharsPerLine) =>
        set({ maxCharsPerLine: Math.max(15, Math.min(40, maxCharsPerLine)) }),

      setLinesPerSubtitle: (linesPerSubtitle) =>
        set({ linesPerSubtitle: Math.max(1, Math.min(2, linesPerSubtitle)) }),

      setOpenaiApiKey: (openaiApiKey) => set({ openaiApiKey }),

      setUseScriptReference: (useScriptReference) => set({ useScriptReference }),
    }),
    {
      name: 'vsp-subtitle-settings-storage',
    }
  )
)
