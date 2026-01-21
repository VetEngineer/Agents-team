import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { createApiClient, ApiClient, User } from '@vsp/api-client'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  apiClient: ApiClient
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'vsp_access_token'
const REFRESH_TOKEN_KEY = 'vsp_refresh_token'

interface AuthProviderProps {
  children: ReactNode
  apiBaseUrl: string
}

export function AuthProvider({ children, apiBaseUrl }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getAccessToken = useCallback(() => {
    return localStorage.getItem(TOKEN_KEY)
  }, [])

  const setTokens = useCallback((accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }, [])

  const clearTokens = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }, [])

  const [apiClient] = useState(() =>
    createApiClient({
      baseUrl: apiBaseUrl,
      getAccessToken,
      onTokenRefresh: ({ accessToken, refreshToken }) => {
        setTokens(accessToken, refreshToken)
      },
      onAuthError: () => {
        clearTokens()
        setUser(null)
      },
    })
  )

  // 초기 로드 시 사용자 정보 확인
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken()
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const currentUser = await apiClient.getCurrentUser()
        setUser(currentUser)
      } catch {
        clearTokens()
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [apiClient, getAccessToken, clearTokens])

  const signIn = async (email: string, password: string) => {
    const response = await apiClient.signIn({ email, password })
    setTokens(response.accessToken, response.refreshToken)
    setUser(response.user)
  }

  const signUp = async (email: string, password: string, name?: string) => {
    const response = await apiClient.signUp({ email, password, name })
    setTokens(response.accessToken, response.refreshToken)
    setUser(response.user)
  }

  const signOut = async () => {
    try {
      await apiClient.signOut()
    } finally {
      clearTokens()
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        apiClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
