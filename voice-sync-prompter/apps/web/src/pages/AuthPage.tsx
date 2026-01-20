import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Button } from '@vsp/ui'
import { useAuth } from '@/contexts/AuthContext'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const isSignUp = searchParams.get('mode') === 'signup'
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        await signUp(email, password, name || undefined)
      } else {
        await signIn(email, password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '오류가 발생했습니다. 다시 시도해주세요.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="text-xl font-bold">Voice Sync Prompter</Link>
        </div>
      </header>

      {/* Auth Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-8">
            {isSignUp ? '회원가입' : '로그인'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium mb-2">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="홍길동"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '처리 중...' : isSignUp ? '가입하기' : '로그인'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? (
              <>
                이미 계정이 있으신가요?{' '}
                <Link to="/auth" className="text-primary hover:underline">
                  로그인
                </Link>
              </>
            ) : (
              <>
                계정이 없으신가요?{' '}
                <Link to="/auth?mode=signup" className="text-primary hover:underline">
                  회원가입
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
