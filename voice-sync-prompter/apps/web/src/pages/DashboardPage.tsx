import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@vsp/ui'
import { useAuth } from '@/contexts/AuthContext'
import { Script } from '@vsp/api-client'
import { Plus, FileText, Settings, LogOut, Trash2 } from 'lucide-react'

export default function DashboardPage() {
  const { user, signOut, apiClient } = useAuth()
  const navigate = useNavigate()
  const [scripts, setScripts] = useState<Script[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadScripts = async () => {
      try {
        const data = await apiClient.getScripts()
        setScripts(data)
      } catch (error) {
        console.error('Failed to load scripts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadScripts()
  }, [apiClient])

  const handleCreateScript = async () => {
    try {
      const script = await apiClient.createScript({
        title: '새 대본',
        content: '',
      })
      navigate(`/prompter/${script.id}`)
    } catch (error) {
      console.error('Failed to create script:', error)
    }
  }

  const handleDeleteScript = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('이 대본을 삭제하시겠습니까?')) return

    try {
      await apiClient.deleteScript(id)
      setScripts((prev) => prev.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Failed to delete script:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">Voice Sync Prompter</Link>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">내 대본</h1>
          <Button onClick={handleCreateScript}>
            <Plus className="w-4 h-4 mr-2" />
            새 대본
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : scripts.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">아직 대본이 없습니다</p>
            <Button onClick={handleCreateScript}>
              <Plus className="w-4 h-4 mr-2" />
              첫 대본 만들기
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scripts.map((script) => (
              <Link
                key={script.id}
                to={`/prompter/${script.id}`}
                className="block p-4 border rounded-lg hover:border-primary transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{script.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {script.content || '내용 없음'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(script.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteScript(script.id, e)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
