import type {
  User,
  AuthResponse,
  SignUpRequest,
  SignInRequest,
  Script,
  CreateScriptRequest,
  UpdateScriptRequest,
  TranscriptionRequest,
  TranscriptionResponse,
  Subscription,
  CheckoutResponse,
  ApiError,
} from './types'

export interface ApiClientConfig {
  baseUrl: string
  getAccessToken?: () => string | null
  onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void
  onAuthError?: () => void
}

/**
 * Voice Sync Prompter API 클라이언트
 */
export class ApiClient {
  private baseUrl: string
  private getAccessToken: () => string | null
  private onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void
  private onAuthError?: () => void

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '')
    this.getAccessToken = config.getAccessToken ?? (() => null)
    this.onTokenRefresh = config.onTokenRefresh
    this.onAuthError = config.onAuthError
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = this.getAccessToken()

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token) {
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      if (response.status === 401) {
        this.onAuthError?.()
      }

      let errorData: Partial<ApiError>
      try {
        errorData = await response.json()
      } catch {
        errorData = {}
      }

      const error: ApiError = {
        code: errorData.code ?? 'UNKNOWN_ERROR',
        message: errorData.message ?? 'An unknown error occurred',
        status: response.status,
      }
      throw error
    }

    return response.json()
  }

  private async requestFormData<T>(
    endpoint: string,
    formData: FormData
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const token = this.getAccessToken()

    const headers: HeadersInit = {}
    if (token) {
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      if (response.status === 401) {
        this.onAuthError?.()
      }

      let errorData: Partial<ApiError>
      try {
        errorData = await response.json()
      } catch {
        errorData = {}
      }

      const error: ApiError = {
        code: errorData.code ?? 'UNKNOWN_ERROR',
        message: errorData.message ?? 'An unknown error occurred',
        status: response.status,
      }
      throw error
    }

    return response.json()
  }

  // ============ Auth ============

  async signUp(data: SignUpRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async signIn(data: SignInRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async signOut(): Promise<void> {
    await this.request<void>('/auth/signout', {
      method: 'POST',
    })
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me')
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
    this.onTokenRefresh?.(response)
    return response
  }

  // ============ Scripts ============

  async getScripts(): Promise<Script[]> {
    return this.request<Script[]>('/scripts')
  }

  async getScript(id: string): Promise<Script> {
    return this.request<Script>(`/scripts/${id}`)
  }

  async createScript(data: CreateScriptRequest): Promise<Script> {
    return this.request<Script>('/scripts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateScript(id: string, data: UpdateScriptRequest): Promise<Script> {
    return this.request<Script>(`/scripts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteScript(id: string): Promise<void> {
    await this.request<void>(`/scripts/${id}`, {
      method: 'DELETE',
    })
  }

  // ============ Transcription ============

  async transcribe(data: TranscriptionRequest): Promise<TranscriptionResponse> {
    const formData = new FormData()
    const audioFile = new File([data.audioBlob], 'audio.webm', {
      type: data.audioBlob.type,
    })
    formData.append('file', audioFile)

    if (data.language) {
      formData.append('language', data.language)
    }

    if (data.prompt) {
      formData.append('prompt', data.prompt)
    }

    return this.requestFormData<TranscriptionResponse>('/transcription', formData)
  }

  // ============ Subscription ============

  async getSubscription(): Promise<Subscription> {
    return this.request<Subscription>('/subscription')
  }

  async createCheckoutSession(plan: 'pro' | 'team'): Promise<CheckoutResponse> {
    return this.request<CheckoutResponse>('/subscription/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    })
  }

  async cancelSubscription(): Promise<void> {
    await this.request<void>('/subscription/cancel', {
      method: 'POST',
    })
  }
}

/**
 * API 클라이언트 인스턴스 생성 헬퍼
 */
export const createApiClient = (config: ApiClientConfig) => new ApiClient(config)
