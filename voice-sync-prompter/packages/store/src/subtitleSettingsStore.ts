import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PersistenceAdapter } from './persistence/types'
import { localStorageAdapter } from './persistence/localStorageAdapter'

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

/**
 * 영속성 어댑터를 사용하는 커스텀 스토리지 생성
 */
const createAsyncStorage = (adapter: PersistenceAdapter) => ({
  getItem: async (name: string) => {
    const value = await adapter.getItem(name)
    return value ?? null
  },
  setItem: async (name: string, value: string) => {
    await adapter.setItem(name, value)
  },
  removeItem: async (name: string) => {
    await adapter.removeItem(name)
  },
})

/**
 * 자막 설정 스토어 생성 팩토리
 */
export const createSubtitleSettingsStore = (adapter: PersistenceAdapter = localStorageAdapter) =>
  create<SubtitleSettingsState>()(
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
        storage: createJSONStorage(() => createAsyncStorage(adapter)),
      }
    )
  )

/**
 * 기본 자막 설정 스토어 (localStorage 사용)
 */
export const useSubtitleSettingsStore = createSubtitleSettingsStore()
