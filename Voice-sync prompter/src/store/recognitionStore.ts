import { create } from 'zustand'

export type RecognitionStatus = 'idle' | 'requesting' | 'listening' | 'processing' | 'error'

interface RecognitionState {
  // 음성 인식 상태
  status: RecognitionStatus
  // 현재 인식 중인 텍스트 (interim)
  interimText: string
  // 마지막으로 확정된 텍스트
  finalText: string
  // 에러 메시지
  errorMessage: string | null
  // 마이크 권한 상태
  hasPermission: boolean | null
  // 지원 여부
  isSupported: boolean

  // Actions
  setStatus: (status: RecognitionStatus) => void
  setInterimText: (text: string) => void
  setFinalText: (text: string) => void
  setErrorMessage: (message: string | null) => void
  setHasPermission: (hasPermission: boolean) => void
  setIsSupported: (isSupported: boolean) => void
  reset: () => void
}

export const useRecognitionStore = create<RecognitionState>()((set) => ({
  status: 'idle',
  interimText: '',
  finalText: '',
  errorMessage: null,
  hasPermission: null,
  isSupported: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window),

  setStatus: (status) => set({ status }),
  setInterimText: (interimText) => set({ interimText }),
  setFinalText: (finalText) => set({ finalText }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setHasPermission: (hasPermission) => set({ hasPermission }),
  setIsSupported: (isSupported) => set({ isSupported }),
  reset: () => set({
    status: 'idle',
    interimText: '',
    finalText: '',
    errorMessage: null,
  }),
}))
