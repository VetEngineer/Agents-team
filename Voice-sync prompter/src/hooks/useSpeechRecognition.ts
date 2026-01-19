import { useCallback, useEffect, useRef } from 'react'
import { useRecognitionStore } from '@/store'

// Web Speech API 타입 정의
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

interface UseSpeechRecognitionOptions {
  lang?: string
  continuous?: boolean
  interimResults?: boolean
  onResult?: (text: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

export const useSpeechRecognition = (options: UseSpeechRecognitionOptions = {}) => {
  const {
    lang = 'ko-KR',
    continuous = true,
    interimResults = true,
    onResult,
    onError,
  } = options

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isListeningRef = useRef(false)

  const {
    status,
    isSupported,
    setStatus,
    setInterimText,
    setFinalText,
    setErrorMessage,
    setHasPermission,
    setIsSupported,
  } = useRecognitionStore()

  // 음성 인식 지원 여부 확인
  useEffect(() => {
    const supported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
    setIsSupported(supported)
  }, [setIsSupported])

  // 음성 인식 초기화
  const initRecognition = useCallback(() => {
    // 직접 브라우저 API 존재 여부 확인 (스토어 의존성 제거)
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      console.warn('[VSP] SpeechRecognition API not available')
      return null
    }

    if (import.meta.env.DEV) {
      console.log('[VSP] Creating new SpeechRecognition instance')
    }

    const recognition = new SpeechRecognitionAPI()

    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = lang
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      if (import.meta.env.DEV) {
        console.log('[VSP] onstart event fired')
      }
      setStatus('listening')
      setErrorMessage(null)
      isListeningRef.current = true
    }

    recognition.onend = () => {
      if (import.meta.env.DEV) {
        console.log('[VSP] onend event fired, isListeningRef:', isListeningRef.current)
      }
      if (isListeningRef.current) {
        // 자동 재시작 (continuous 모드에서 브라우저가 멈출 때)
        try {
          if (import.meta.env.DEV) {
            console.log('[VSP] Auto-restarting recognition...')
          }
          recognition.start()
        } catch (e) {
          if (import.meta.env.DEV) {
            console.error('[VSP] Auto-restart failed:', e)
          }
          setStatus('idle')
          isListeningRef.current = false
        }
      } else {
        setStatus('idle')
      }
    }

    recognition.onerror = (event) => {
      if (import.meta.env.DEV) {
        console.error('[VSP] onerror event fired:', event.error, event.message)
      }
      const errorMessage = getErrorMessage(event.error)

      if (event.error === 'not-allowed') {
        setHasPermission(false)
      }

      // 네트워크 에러나 no-speech는 무시하고 계속
      if (event.error === 'network' || event.error === 'no-speech') {
        if (import.meta.env.DEV) {
          console.log('[VSP] Ignoring error:', event.error)
        }
        return
      }

      setErrorMessage(errorMessage)
      onError?.(errorMessage)
    }

    recognition.onresult = (event) => {
      if (import.meta.env.DEV) {
        console.log('[VSP] onresult event fired, results:', event.results.length)
      }
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript

        if (import.meta.env.DEV) {
          console.log('[VSP] Transcript:', transcript, 'isFinal:', event.results[i].isFinal)
        }

        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (interimTranscript) {
        setInterimText(interimTranscript)
        onResult?.(interimTranscript, false)
      }

      if (finalTranscript) {
        setFinalText(finalTranscript)
        setInterimText('')
        onResult?.(finalTranscript, true)
      }
    }

    return recognition
  }, [
    continuous,
    interimResults,
    lang,
    setStatus,
    setInterimText,
    setFinalText,
    setErrorMessage,
    setHasPermission,
    onResult,
    onError,
  ])

  // 마이크 권한 요청
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      setHasPermission(true)
      return true
    } catch {
      setHasPermission(false)
      setErrorMessage('마이크 권한이 필요합니다')
      return false
    }
  }, [setHasPermission, setErrorMessage])

  // 음성 인식 시작
  const startListening = useCallback(async () => {
    // 직접 브라우저 API 확인
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionAPI) {
      console.warn('[VSP] Browser does not support SpeechRecognition')
      setErrorMessage('이 브라우저는 음성 인식을 지원하지 않습니다')
      return
    }

    // 이미 듣고 있으면 무시
    if (isListeningRef.current) {
      if (import.meta.env.DEV) {
        console.log('[VSP] Already listening, ignoring start request')
      }
      return
    }

    if (import.meta.env.DEV) {
      console.log('[VSP] Starting speech recognition...')
    }

    // 권한 요청 상태로 변경
    setStatus('requesting')

    // 권한 확인
    if (import.meta.env.DEV) {
      console.log('[VSP] Requesting microphone permission...')
    }
    const hasPermission = await requestPermission()
    if (!hasPermission) {
      if (import.meta.env.DEV) {
        console.log('[VSP] Microphone permission denied')
      }
      setStatus('idle')
      return
    }

    if (import.meta.env.DEV) {
      console.log('[VSP] Microphone permission granted')
    }

    // 기존 인스턴스 정리
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }

    // 새 인스턴스 생성 및 시작
    const recognition = initRecognition()
    if (recognition) {
      recognitionRef.current = recognition
      try {
        if (import.meta.env.DEV) {
          console.log('[VSP] Starting recognition instance...')
        }
        recognition.start()
        // recognition.start() 호출 직후 상태 설정 (onstart 이벤트 대기하지 않음)
        isListeningRef.current = true
        setStatus('listening')
        if (import.meta.env.DEV) {
          console.log('[VSP] Status set to listening')
        }
      } catch (error) {
        console.error('[VSP] Speech recognition start error:', error)
        setErrorMessage('음성 인식을 시작할 수 없습니다')
        setStatus('idle')
        isListeningRef.current = false
      }
    } else {
      console.error('[VSP] Failed to create recognition instance')
      setErrorMessage('음성 인식 초기화에 실패했습니다')
      setStatus('idle')
    }
  }, [requestPermission, initRecognition, setErrorMessage, setStatus])

  // 음성 인식 중지
  const stopListening = useCallback(() => {
    isListeningRef.current = false
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setStatus('idle')
    setInterimText('')
  }, [setStatus, setInterimText])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      isListeningRef.current = false
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionRef.current = null
      }
    }
  }, [])

  return {
    isListening: status === 'listening',
    isSupported,
    startListening,
    stopListening,
    requestPermission,
  }
}

// 에러 메시지 변환
function getErrorMessage(error: string): string {
  switch (error) {
    case 'not-allowed':
      return '마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.'
    case 'no-speech':
      return '음성이 감지되지 않았습니다.'
    case 'audio-capture':
      return '마이크를 찾을 수 없습니다.'
    case 'network':
      return '네트워크 오류가 발생했습니다.'
    case 'aborted':
      return '음성 인식이 중단되었습니다.'
    case 'language-not-supported':
      return '지원되지 않는 언어입니다.'
    case 'service-not-allowed':
      return '음성 인식 서비스를 사용할 수 없습니다.'
    default:
      return `음성 인식 오류: ${error}`
  }
}
