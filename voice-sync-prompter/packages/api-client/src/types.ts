/**
 * API 클라이언트 타입 정의
 */

// 사용자 인증 관련
export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  plan: 'free' | 'pro' | 'team'
  createdAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface SignUpRequest {
  email: string
  password: string
  name?: string
}

export interface SignInRequest {
  email: string
  password: string
}

// 대본 관련
export interface Script {
  id: string
  userId: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface CreateScriptRequest {
  title: string
  content: string
}

export interface UpdateScriptRequest {
  title?: string
  content?: string
}

// 트랜스크립션 관련
export interface TranscriptionRequest {
  audioBlob: Blob
  language?: string
  prompt?: string
}

export interface TranscriptionResponse {
  text: string
  segments: Array<{
    start: number
    end: number
    text: string
  }>
  duration: number
}

// 구독 관련
export interface Subscription {
  id: string
  userId: string
  plan: 'free' | 'pro' | 'team'
  status: 'active' | 'canceled' | 'past_due'
  currentPeriodStart: string
  currentPeriodEnd: string
  whisperMinutesUsed: number
  whisperMinutesLimit: number
}

export interface CheckoutResponse {
  checkoutUrl: string
}

// API 에러
export interface ApiError {
  code: string
  message: string
  status: number
}
