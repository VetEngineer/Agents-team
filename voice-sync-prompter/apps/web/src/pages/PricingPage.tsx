import { Link } from 'react-router-dom'
import { Button } from '@vsp/ui'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: '개인 사용자를 위한 기본 플랜',
    features: [
      '로컬 저장',
      '브라우저 음성 인식',
      '기본 프롬프터 기능',
      '무제한 대본',
    ],
    cta: '무료로 시작',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$9.99',
    period: '/월',
    description: '전문 크리에이터를 위한 플랜',
    features: [
      'Free 모든 기능',
      '클라우드 동기화',
      'Whisper AI 1시간/월',
      'SRT 자막 다운로드',
      '우선 지원',
    ],
    cta: '프로 시작하기',
    highlighted: true,
  },
  {
    name: 'Team',
    price: '$29.99',
    period: '/월',
    description: '팀과 스튜디오를 위한 플랜',
    features: [
      'Pro 모든 기능',
      '무제한 Whisper AI',
      '팀 공유 기능',
      '관리자 대시보드',
      '전용 지원',
    ],
    cta: '팀 시작하기',
    highlighted: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">Voice Sync Prompter</Link>
          <nav className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="outline">로그인</Button>
            </Link>
            <Link to="/auth?mode=signup">
              <Button>시작하기</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">요금제</h1>
            <p className="text-muted-foreground text-lg">
              필요에 맞는 플랜을 선택하세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg border p-6 ${
                  plan.highlighted
                    ? 'border-primary ring-2 ring-primary'
                    : ''
                }`}
              >
                {plan.highlighted && (
                  <span className="inline-block px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-full mb-4">
                    인기
                  </span>
                )}
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-muted-foreground mb-6">{plan.description}</p>
                <Link to="/auth?mode=signup">
                  <Button
                    className="w-full mb-6"
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">자주 묻는 질문</h2>
          <div className="space-y-6">
            <FaqItem
              question="무료 플랜으로 어떤 기능을 사용할 수 있나요?"
              answer="무료 플랜에서는 로컬 저장, 브라우저 음성 인식, 기본 프롬프터 기능을 사용할 수 있습니다. Whisper AI 자막 생성은 Pro 이상 플랜에서 사용 가능합니다."
            />
            <FaqItem
              question="플랜을 업그레이드하거나 다운그레이드할 수 있나요?"
              answer="네, 언제든지 플랜을 변경할 수 있습니다. 업그레이드 시 즉시 적용되며, 다운그레이드는 현재 결제 기간이 끝난 후 적용됩니다."
            />
            <FaqItem
              question="화면 캡처 방지 기능은 어떻게 작동하나요?"
              answer="데스크톱 앱에서 Windows의 SetWindowDisplayAffinity API와 macOS의 NSWindow.sharingType을 사용하여 OBS 등의 녹화 프로그램에서 프롬프터 창을 숨깁니다. macOS 15 이상에서는 Apple 정책으로 인해 제한됩니다."
            />
          </div>
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

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-background rounded-lg p-6 border">
      <h4 className="font-semibold mb-2">{question}</h4>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  )
}
