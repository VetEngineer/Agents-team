import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

export const useScriptStore = create<ScriptState>()(
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
      partialize: (state) => ({ text: state.text }),
    }
  )
)
