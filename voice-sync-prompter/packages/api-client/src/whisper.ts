import type { WhisperResponse, WhisperError } from '@vsp/core'

const WHISPER_API_URL = 'https://api.openai.com/v1/audio/transcriptions'

interface TranscribeOptions {
  apiKey: string
  audioBlob: Blob
  language?: string
  prompt?: string
}

/**
 * Whisper API 에러 파싱
 */
const parseWhisperError = (status: number, errorData: unknown): WhisperError => {
  if (status === 401) {
    return { type: 'auth', message: 'API 키가 유효하지 않습니다', status }
  }
  if (status === 429) {
    return { type: 'rate_limit', message: 'API 요청 한도 초과', status }
  }
  if (status === 413) {
    return { type: 'file_size', message: '녹음 파일이 너무 큽니다 (최대 25MB)', status }
  }

  const errorMessage = errorData && typeof errorData === 'object' && 'error' in errorData
    ? (errorData as { error: { message: string } }).error?.message || '알 수 없는 오류'
    : '알 수 없는 오류'

  return { type: 'unknown', message: errorMessage, status }
}

/**
 * Whisper API 직접 호출 (클라이언트 사이드용)
 * 주의: API 키가 노출될 수 있으므로 프로덕션에서는 서버 프록시 사용 권장
 */
export const transcribeAudioDirect = async ({
  apiKey,
  audioBlob,
  language = 'ko',
  prompt
}: TranscribeOptions): Promise<WhisperResponse> => {
  if (!apiKey) {
    throw { type: 'auth', message: 'API 키가 필요합니다' } as WhisperError
  }

  // 파일 크기 확인 (25MB 제한)
  if (audioBlob.size > 25 * 1024 * 1024) {
    throw { type: 'file_size', message: '녹음 파일이 너무 큽니다 (최대 25MB)' } as WhisperError
  }

  const formData = new FormData()

  // Blob을 File로 변환 (파일명 필요)
  const audioFile = new File([audioBlob], 'audio.webm', { type: audioBlob.type })
  formData.append('file', audioFile)
  formData.append('model', 'whisper-1')
  formData.append('language', language)
  formData.append('response_format', 'verbose_json')

  // 대본 힌트 추가 (음성 인식 정확도 향상)
  if (prompt) {
    const truncatedPrompt = prompt.slice(0, 500)
    formData.append('prompt', truncatedPrompt)
  }

  try {
    const response = await fetch(WHISPER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    })

    if (!response.ok) {
      let errorData: unknown
      try {
        errorData = await response.json()
      } catch {
        errorData = null
      }
      throw parseWhisperError(response.status, errorData)
    }

    const result: WhisperResponse = await response.json()
    return result

  } catch (error) {
    // 이미 WhisperError 형태면 그대로 throw
    if (error && typeof error === 'object' && 'type' in error) {
      throw error
    }

    // 네트워크 에러
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw { type: 'network', message: '네트워크 연결을 확인해주세요' } as WhisperError
    }

    throw { type: 'unknown', message: '알 수 없는 오류가 발생했습니다' } as WhisperError
  }
}

/**
 * API 키 유효성 검사 (간단한 형식 체크)
 */
export const validateApiKey = (apiKey: string): boolean => {
  return apiKey.startsWith('sk-') && apiKey.length > 20
}
