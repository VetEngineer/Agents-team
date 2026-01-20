import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PersistenceAdapter } from './persistence/types'
import { localStorageAdapter } from './persistence/localStorageAdapter'

export type Theme = 'light' | 'dark'
export type ViewMode = 'edit' | 'prompter'

interface SettingsState {
  // 폰트 크기 (px)
  fontSize: number
  // 줄 간격 (배수)
  lineHeight: number
  // 테마
  theme: Theme
  // 현재 뷰 모드
  viewMode: ViewMode
  // 미러 모드 (좌우 반전)
  mirrorMode: boolean
  // 자동 스크롤 활성화
  autoScrollEnabled: boolean
  // 스크롤 속도 (1-10)
  scrollSpeed: number
  // 현재 줄 하이라이트 색상
  highlightColor: string

  // Actions
  setFontSize: (size: number) => void
  setLineHeight: (height: number) => void
  setTheme: (theme: Theme) => void
  setViewMode: (mode: ViewMode) => void
  setMirrorMode: (enabled: boolean) => void
  setAutoScrollEnabled: (enabled: boolean) => void
  setScrollSpeed: (speed: number) => void
  setHighlightColor: (color: string) => void
  toggleTheme: () => void
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
 * 설정 스토어 생성 팩토리
 * 다양한 영속성 어댑터를 지원
 */
export const createSettingsStore = (adapter: PersistenceAdapter = localStorageAdapter) =>
  create<SettingsState>()(
    persist(
      (set) => ({
        fontSize: 32,
        lineHeight: 1.8,
        theme: 'dark',
        viewMode: 'edit',
        mirrorMode: false,
        autoScrollEnabled: true,
        scrollSpeed: 5,
        highlightColor: '#fbbf24', // amber-400

        setFontSize: (fontSize) => set({ fontSize: Math.max(16, Math.min(72, fontSize)) }),
        setLineHeight: (lineHeight) => set({ lineHeight: Math.max(1, Math.min(3, lineHeight)) }),
        setTheme: (theme) => set({ theme }),
        setViewMode: (viewMode) => set({ viewMode }),
        setMirrorMode: (mirrorMode) => set({ mirrorMode }),
        setAutoScrollEnabled: (autoScrollEnabled) => set({ autoScrollEnabled }),
        setScrollSpeed: (scrollSpeed) => set({ scrollSpeed: Math.max(1, Math.min(10, scrollSpeed)) }),
        setHighlightColor: (highlightColor) => set({ highlightColor }),
        toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      }),
      {
        name: 'vsp-settings-storage',
        storage: createJSONStorage(() => createAsyncStorage(adapter)),
      }
    )
  )

/**
 * 기본 설정 스토어 (localStorage 사용)
 */
export const useSettingsStore = createSettingsStore()
