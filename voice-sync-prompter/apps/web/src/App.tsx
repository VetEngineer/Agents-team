import { Routes, Route, Navigate } from 'react-router-dom'
import { useSettingsStore } from '@vsp/store'
import { useAuth } from './contexts/AuthContext'

// Pages
import LandingPage from './pages/LandingPage'
import PricingPage from './pages/PricingPage'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import PrompterPage from './pages/PrompterPage'
import SettingsPage from './pages/SettingsPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />
}

function App() {
  const { theme } = useSettingsStore()

  return (
    <div className={theme}>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Private routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/prompter/:scriptId?"
            element={
              <PrivateRoute>
                <PrompterPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
