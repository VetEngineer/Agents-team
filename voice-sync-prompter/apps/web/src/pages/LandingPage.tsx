import { Link } from 'react-router-dom'
import { Button } from '@vsp/ui'
import { Mic, Monitor, Shield, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Voice Sync Prompter</h1>
          <nav className="flex items-center gap-4">
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground">
              요금제
            </Link>
            <Link to="/auth">
              <Button variant="outline">로그인</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button>시작하기</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-5xl font-bold mb-6">
            음성 인식 기반
            <br />
            <span className="text-primary">스마트 프롬프터</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            대본을 읽으면서 자동으로 스크롤됩니다.
            <br />
            방송인, 유튜버, 발표자를 위한 최적의 솔루션
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth?mode=signup">
              <Button size="lg">무료로 시작하기</Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline">요금제 보기</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">주요 기능</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Mic className="w-8 h-8" />}
              title="음성 인식 스크롤"
              description="당신의 목소리에 맞춰 대본이 자동으로 스크롤됩니다"
            />
            <FeatureCard
              icon={<Zap className="w-8 h-8" />}
              title="Whisper AI 자막"
              description="OpenAI Whisper로 정확한 자막을 자동 생성합니다"
            />
            <FeatureCard
              icon={<Monitor className="w-8 h-8" />}
              title="데스크톱 앱"
              description="Windows/Mac 네이티브 앱으로 더 빠르게"
            />
            <FeatureCard
              icon={<Shield className="w-8 h-8" />}
              title="화면 캡처 방지"
              description="OBS 녹화에서 프롬프터 화면을 숨깁니다"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h3 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h3>
          <p className="text-muted-foreground mb-8">
            무료 플랜으로 기본 기능을 체험해보세요
          </p>
          <Link to="/auth?mode=signup">
            <Button size="lg">무료로 시작하기</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 Voice Sync Prompter. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-lg border bg-background">
      <div className="text-primary mb-4">{icon}</div>
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
