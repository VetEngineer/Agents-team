import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PersistenceAdapter } from './persistence/types'
import { localStorageAdapter } from './persistence/localStorageAdapter'

interface ScriptState {
  // 대본 텍스트
  text: string
  // 현재 위치 (문자 인덱스)
  currentPosition: number
  // 현재 줄 번호
  currentLine: number
  // 매칭 신뢰도
  confidence: number
  // 대본을 줄 단위로 분리한 배열
  lines: string[]

  // Actions
  setText: (text: string) => void
  setCurrentPosition: (position: number) => void
  setCurrentLine: (line: number) => void
  setConfidence: (confidence: number) => void
  reset: () => void
}

// 텍스트를 줄 단위로 분리하는 헬퍼 함수
const splitIntoLines = (text: string): string[] => {
  return text.split('\n')
}

// 문자 위치에서 줄 번호를 계산하는 헬퍼 함수
const getLineFromPosition = (text: string, position: number): number => {
  const textUpToPosition = text.substring(0, position)
  return textUpToPosition.split('\n').length - 1
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
 * 스크립트 스토어 생성 팩토리
 */
export const createScriptStore = (adapter: PersistenceAdapter = localStorageAdapter) =>
  create<ScriptState>()(
    persist(
      (set) => ({
        text: '',
        currentPosition: 0,
        currentLine: 0,
        confidence: 0,
        lines: [],

        setText: (text) => set({
          text,
          lines: splitIntoLines(text),
          currentPosition: 0,
          currentLine: 0,
          confidence: 0
        }),

        setCurrentPosition: (position) => set((state) => ({
          currentPosition: position,
          currentLine: getLineFromPosition(state.text, position)
        })),

        setCurrentLine: (line) => set({ currentLine: line }),

        setConfidence: (confidence) => set({ confidence }),

        reset: () => set({
          currentPosition: 0,
          currentLine: 0,
          confidence: 0
        }),
      }),
      {
        name: 'vsp-script-storage',
        storage: createJSONStorage(() => createAsyncStorage(adapter)),
        partialize: (state) => ({ text: state.text }),
      }
    )
  )

/**
 * 기본 스크립트 스토어 (localStorage 사용)
 */
export const useScriptStore = createScriptStore()
