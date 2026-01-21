import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'

export interface CaptureProtectionStatus {
  enabled: boolean
  supported: boolean
  platform: string
  message: string | null
}

export function useCaptureProtection() {
  const [status, setStatus] = useState<CaptureProtectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 초기 지원 상태 확인
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const result = await invoke<CaptureProtectionStatus>('get_capture_protection_support')
        setStatus(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : '지원 상태 확인 실패')
      } finally {
        setLoading(false)
      }
    }

    checkSupport()
  }, [])

  // 화면 캡처 방지 활성화
  const enableProtection = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await invoke<CaptureProtectionStatus>('enable_capture_protection')
      setStatus(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '활성화 실패'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // 화면 캡처 방지 비활성화
  const disableProtection = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await invoke<CaptureProtectionStatus>('disable_capture_protection')
      setStatus(result)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '비활성화 실패'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  // 토글
  const toggleProtection = useCallback(async () => {
    if (status?.enabled) {
      return disableProtection()
    } else {
      return enableProtection()
    }
  }, [status, enableProtection, disableProtection])

  return {
    status,
    loading,
    error,
    isEnabled: status?.enabled ?? false,
    isSupported: status?.supported ?? false,
    platform: status?.platform ?? 'unknown',
    message: status?.message ?? null,
    enableProtection,
    disableProtection,
    toggleProtection,
  }
}
