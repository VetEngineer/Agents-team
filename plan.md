# BrandBlog AI - 블로그 자동화 웹서비스

> 브랜드 일관성을 유지하며 SEO 최적화된 블로그 콘텐츠를 자동 생성하는 웹서비스

## Dev Notes

- Keyword generator notes: `log.md`

## 1. 프로젝트 개요

### 1.1 서비스 정의

| 항목 | 내용 |
|------|------|
| 서비스명 | BrandBlog AI (가칭) |
| 초기 형태 | 사내 서비스 → SaaS 확장 |
| 핵심 가치 | 브랜드 일관성 유지 + SEO 최적화 + 콘텐츠 자동 생성 |

### 1.2 핵심 기능 요약

1. **브랜드 관리**: 브랜드 정보, 톤앤매너, 레퍼런스 글 학습
2. **퍼널 기반 콘텐츠**: 탑퍼널(인지) / 바텀퍼널(전환) 전략 적용
3. **개요 승인 워크플로우**: 본문 생성 전 개요 검토로 토큰 절약
4. **이미지/GIF 생성**: 실사 활용 또는 일러스트 스타일
5. **콘텐츠 소스 모니터링**: RSS/YouTube 자동 수집 및 재가공
6. **다중 플랫폼 발행**: 티스토리, 워드프레스, 네이버 등

---

## 2. 사용자 & 권한 구조

### 2.1 역할 정의

```
서비스 운영자 (Admin)
├── 전체 브랜드 관리
├── 사용자 권한 관리
└── 요금제/사용량 관리 (SaaS 전환 시)

브랜드 매니저 (Manager)
├── 브랜드 설정 관리
├── 멤버 초대
└── 발행 승인

에디터 (Editor)
├── 콘텐츠 생성/수정
└── 발행 요청 (승인 필요)
```

### 2.2 멀티테넌시 구조

- 한 브랜드에 여러 사용자 접근 가능
- 사용자는 개별 회원가입
- 서비스 운영자가 권한 관리
- SaaS 전환 시 브랜드별 요금제 적용

---

## 3. 핵심 워크플로우

### 3.1 콘텐츠 생성 플로우 (개요 승인 포함)

```
STEP 1: 콘텐츠 요청
├── 브랜드 선택
├── 퍼널 선택 (탑/바텀)
├── 메인 키워드 (SEO 타겟)
├── 글 주제
├── 이미지 스타일 (실사/일러스트)
└── GIF 생성 여부

STEP 2: 개요 생성 (저비용 ~500 토큰)
├── 제목 후보 3개
├── 메타 디스크립션
├── 서론 방향
├── 본론 섹션 구성 (H2 + 핵심 포인트)
├── 결론 방향
├── CTA 문구 제안
└── 이미지 컨셉

STEP 3: 사용자 피드백
├── 제목 선택/수정
├── 섹션 순서 변경/추가/삭제
├── 각 섹션 추가 지시사항
├── 톤 조정 요청
└── [승인] 또는 [수정 요청]

STEP 4: 본문 생성 (고비용 ~3000-5000 토큰)
├── 승인된 개요 기반 작성
├── 서론 → 본론 → 결론 → CTA
├── 이미지/GIF 생성
└── SEO 메타 태그 생성

STEP 5: 최종 검토 & 발행
├── 미리보기
├── 부분 수정 (섹션별 재생성)
└── 즉시/예약 발행
```

### 3.2 콘텐츠 소스 자동 수집 플로우

```
소스 등록
├── RSS 피드 URL
├── YouTube 채널/플레이리스트
├── 팟캐스트 피드
└── 뉴스레터 (이메일 파싱)

모니터링
├── 주기적 폴링 (5분~1시간)
├── 키워드 필터링
└── 새 콘텐츠 감지 시 알림

재가공 모드
├── 요약: 핵심만 추출 정리
├── 재작성: 브랜드 스타일로 완전 재작성
└── 코멘터리: 원본 인용 + 브랜드 관점 추가

발행 설정
├── auto: 즉시 자동 발행
├── review: 개요부터 사용자 검토
└── scheduled: 특정 시간 발행
```

---

## 4. 퍼널별 컨텐츠 전략

### 4.1 탑퍼널 (Top of Funnel) - 인지 단계

| 항목 | 내용 |
|------|------|
| 목적 | 잠재 고객 문제 인식, 브랜드 노출 |
| 톤 | 교육적, 공감대 형성 |
| CTA | "더 알아보기", "뉴스레터 구독" |
| 키워드 | 정보성 (how to, 방법, 가이드) |

**구조**:
- 서론: 공감 유도, 문제 제기
- 본론: 원인 분석, 해결 방법 제시, 브랜드 솔루션 언급
- 결론: 핵심 요약
- CTA: 가벼운 행동 유도

### 4.2 바텀퍼널 (Bottom of Funnel) - 전환 단계

| 항목 | 내용 |
|------|------|
| 목적 | 구매 결정 촉진, 전환 유도 |
| 톤 | 설득적, 긴급성 부여 |
| CTA | "지금 구매", "무료 체험" |
| 키워드 | 상업성 (가격, 후기, 비교, 추천) |

**구조**:
- 서론: 결정 직전 공감, 명확한 답 예고
- 본론: 제품 상세, 차별점, 사회적 증거, FAQ
- 결론: 가치 재강조, 긴급성/희소성
- CTA: 강력한 행동 유도 + 혜택

---

## 5. 데이터 모델

### 5.1 사용자 (User)

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'editor';
  brandAccess: BrandAccess[];
  createdAt: Date;
}

interface BrandAccess {
  brandId: string;
  role: 'manager' | 'editor';
}
```

### 5.2 브랜드 (Brand)

```typescript
interface Brand {
  id: string;
  name: string;                    // 상호명
  description: string;             // 브랜드 소개
  industry: string;                // 업종
  targetAudience: string;          // 타겟 고객

  // 브랜드 아이덴티티
  toneOfVoice: ToneOfVoice;
  colors: BrandColors;
  logoUrl: string;

  // 학습 자료
  referenceArticles: ReferenceArticle[];
  brandAssets: BrandAsset[];       // 대표자/제품 사진

  // 발행 연동
  publishingAccounts: PublishingAccount[];

  createdAt: Date;
  updatedAt: Date;
}

interface ToneOfVoice {
  style: 'friendly' | 'professional' | 'humorous' | 'authoritative';
  formality: 'casual' | 'neutral' | 'formal';
  customPrompt?: string;
}

interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

interface ReferenceArticle {
  id: string;
  title: string;
  content: string;
  url?: string;
  analyzedStyle?: {
    sentenceLength: string;
    vocabulary: string;
    structure: string;
  };
}

interface BrandAsset {
  id: string;
  type: 'person' | 'product' | 'logo' | 'other';
  url: string;
  description: string;
}

interface PublishingAccount {
  id: string;
  platform: 'tistory' | 'wordpress' | 'naver' | 'medium';
  credentials: encrypted;
  blogUrl: string;
  isActive: boolean;
}
```

### 5.3 콘텐츠 요청 (ContentRequest)

```typescript
interface ContentRequest {
  id: string;
  brandId: string;
  createdBy: string;

  // 입력값
  funnel: 'top' | 'bottom';
  mainKeyword: string;
  topic: string;
  imageStyle: 'realistic' | 'illustration';
  includeGif: boolean;

  // 상태
  status:
    | 'pending'
    | 'outline_generating'
    | 'outline_review'
    | 'outline_approved'
    | 'content_generating'
    | 'content_review'
    | 'approved'
    | 'published';

  // 참조
  currentOutlineId?: string;
  generatedContentId?: string;

  createdAt: Date;
  updatedAt: Date;
}
```

### 5.4 콘텐츠 개요 (ContentOutline)

```typescript
interface ContentOutline {
  id: string;
  requestId: string;
  version: number;

  // 제목
  titleCandidates: string[];
  selectedTitle?: string;
  customTitle?: string;

  // 메타
  metaDescription: string;

  // 구조
  structure: {
    introduction: OutlineSection;
    body: OutlineBodySection[];
    conclusion: OutlineSection;
    cta: OutlineCTA;
  };

  // 이미지 컨셉
  imageConcept: {
    thumbnail: string;
    bodyImages: string;
    style: 'realistic' | 'illustration';
  };

  // 피드백
  userFeedback?: string;

  // 상태
  status: 'draft' | 'approved' | 'rejected';
  approvedAt?: Date;
  approvedBy?: string;

  createdAt: Date;
}

interface OutlineSection {
  direction: string;
  keyPoints?: string[];
  userNote?: string;
}

interface OutlineBodySection {
  id: string;
  heading: string;
  keyPoints: string[];
  order: number;
  userNote?: string;
}

interface OutlineCTA {
  headline: string;
  buttonText: string;
  userNote?: string;
}
```

### 5.5 생성된 콘텐츠 (GeneratedContent)

```typescript
interface GeneratedContent {
  id: string;
  requestId: string;
  outlineId: string;
  version: number;

  // SEO
  title: string;
  metaDescription: string;
  keywords: string[];

  // 본문
  sections: {
    introduction: string;
    body: BodySection[];
    conclusion: string;
    cta: CTASection;
  };

  // 미디어
  featuredImage: GeneratedMedia;
  bodyImages: GeneratedMedia[];
  gifs: GeneratedMedia[];

  // 메트릭
  seoScore: number;
  wordCount: number;
  estimatedReadTime: number;

  createdAt: Date;
}

interface BodySection {
  heading: string;
  content: string;
  image?: GeneratedMedia;
}

interface CTASection {
  headline: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
}

interface GeneratedMedia {
  id: string;
  type: 'image' | 'gif';
  url: string;
  prompt: string;
  style: 'realistic' | 'illustration';
  usedAssets?: string[];
}
```

### 5.6 콘텐츠 소스 (ContentSource)

```typescript
interface ContentSource {
  id: string;
  brandId: string;
  name: string;

  // 소스 설정
  type: 'rss' | 'youtube' | 'podcast' | 'newsletter';
  config: RSSConfig | YouTubeConfig | PodcastConfig | NewsletterConfig;

  // 모니터링
  pollingInterval: number;         // 분 단위
  isActive: boolean;
  lastCheckedAt: Date;

  // 필터링
  filters: {
    keywords: {
      include: string[];
      exclude: string[];
    };
    minLength?: number;
    language?: string[];
  };

  // 재가공 설정
  processingConfig: {
    mode: 'summary' | 'rewrite' | 'commentary';
    targetLength: 'short' | 'medium' | 'long';
    includeCTA: boolean;
    ctaType?: 'top' | 'bottom';
    generateImages: boolean;
    generateGif: boolean;
  };

  // 발행 설정
  publishConfig: {
    mode: 'auto' | 'review' | 'scheduled';
    targetPlatforms: string[];
    scheduleTime?: string;
    notifyOnNew: boolean;
  };

  createdAt: Date;
}

interface RSSConfig {
  feedUrl: string;
}

interface YouTubeConfig {
  channelId?: string;
  playlistId?: string;
  includeTranscript: boolean;
}

interface PodcastConfig {
  feedUrl: string;
  transcribeAudio: boolean;
}

interface NewsletterConfig {
  inboundEmailAddress: string;
  senderFilter: string[];
}
```

### 5.7 수집된 콘텐츠 (CollectedContent)

```typescript
interface CollectedContent {
  id: string;
  sourceId: string;

  // 원본
  originalTitle: string;
  originalContent: string;
  originalUrl: string;
  originalAuthor?: string;
  originalPublishedAt: Date;
  originalThumbnail?: string;

  // YouTube 전용
  youtubeVideoId?: string;
  transcript?: string;
  duration?: number;

  // 상태
  status: 'new' | 'processing' | 'processed' | 'published' | 'skipped';
  skippedReason?: string;

  // 참조
  generatedContentId?: string;

  collectedAt: Date;
}
```

---

## 6. 기술 스택

### 6.1 Frontend

| 구분 | 기술 | 이유 |
|------|------|------|
| Framework | Next.js 14+ (App Router) | SSR/SSG, SEO, Vercel 배포 |
| Language | TypeScript | 타입 안정성 |
| Styling | Tailwind CSS | 빠른 개발 |
| UI Components | shadcn/ui | 커스터마이징 용이 |
| State (Server) | TanStack Query | 서버 상태 관리 |
| State (Client) | Zustand | 간결한 클라이언트 상태 |
| Editor | Tiptap | WYSIWYG 에디터 |

### 6.2 Backend

| 구분 | 기술 | 이유 |
|------|------|------|
| API | Next.js API Routes | 풀스택 통합 |
| AI Pipeline | FastAPI (Python) | AI 라이브러리 호환성 |
| Task Queue | BullMQ + Redis | 비동기 작업 처리 |
| Scheduler | node-cron / Trigger.dev | 예약 발행, 모니터링 |

### 6.3 Database & Infrastructure

| 구분 | 기술 | 이유 |
|------|------|------|
| Main DB | PostgreSQL (Supabase) | 관계형, 인증 통합 |
| Cache/Queue | Redis | 세션, 캐시, 큐 |
| File Storage | S3 / Cloudflare R2 | 미디어 저장 |
| Deployment | Vercel | 간편한 배포 |

### 6.4 AI Services

| 구분 | 기술 | 용도 |
|------|------|------|
| Text Generation | Claude API | 글 작성 (품질 우수) |
| Analysis | GPT-4o | 보조 분석 |
| Image | DALL-E 3 / Midjourney | 이미지 생성 |
| Video/GIF | Runway / Pika | GIF 생성 |
| Transcription | Whisper API | 음성→텍스트 |

---

## 7. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                      Next.js Application                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages/    │  │   API       │  │   Server Actions        │  │
│  │  Components │  │   Routes    │  │   (mutations)           │  │
│  └─────────────┘  └──────┬──────┘  └───────────┬─────────────┘  │
└──────────────────────────┼─────────────────────┼────────────────┘
                           │                     │
┌──────────────────────────▼─────────────────────▼────────────────┐
│                        Service Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  Brand   │  │  Content │  │ Schedule │  │    Platform     │  │
│  │ Service  │  │  Service │  │  Service │  │   Integration   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬─────────┘  │
└───────┼─────────────┼─────────────┼────────────────┼────────────┘
        │             │             │                │
┌───────▼─────────────▼─────────────▼────────────────▼────────────┐
│                       Infrastructure                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │PostgreSQL│  │  Redis   │  │   S3     │  │   External      │  │
│  │          │  │  Queue   │  │  Storage │  │   APIs          │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Background Workers                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Source     │  │   Content    │  │      Publishing        │ │
│  │   Monitor    │  │   Generator  │  │       Worker           │ │
│  │   Worker     │  │   Worker     │  │                        │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. 개발 로드맵

### Phase 1: MVP (사내 서비스)

- [ ] 프로젝트 초기화 (Next.js, TypeScript, Tailwind, shadcn/ui)
- [ ] 인증 시스템 (회원가입, 로그인, 권한)
- [ ] 브랜드 관리 CRUD
- [ ] 레퍼런스 글 업로드 및 스타일 분석
- [ ] 콘텐츠 개요 생성 및 승인 워크플로우
- [ ] 기본 콘텐츠 생성 (서론-본론-결론-CTA)
- [ ] 일러스트 스타일 이미지 생성
- [ ] 티스토리 발행 연동

### Phase 2: 자동화 확장

- [ ] RSS 피드 모니터링
- [ ] YouTube 채널 연동 + 자막 추출
- [ ] 콘텐츠 재가공 파이프라인 (요약/재작성/코멘터리)
- [ ] 검토 큐 시스템
- [ ] 다중 플랫폼 발행 (워드프레스, 네이버)
- [ ] 예약 발행

### Phase 3: 고급 기능

- [ ] GIF 생성
- [ ] 실사 이미지 합성 (브랜드 에셋 활용)
- [ ] 팟캐스트 음성→텍스트 변환
- [ ] 분석 대시보드 (조회수, 인기 글)
- [ ] SEO 점수 표시

### Phase 4: SaaS 전환

- [ ] 멀티테넌시 완성
- [ ] 요금제 & 결제 시스템 (Stripe)
- [ ] 사용량 제한 & 모니터링
- [ ] 팀 협업 기능 강화
- [ ] Public API 제공

---

## 9. 주의사항

### 9.1 AI 관련

| 항목 | 대응 |
|------|------|
| 환각(Hallucination) | 팩트 체크 필요 글은 출처 검색 또는 사용자 검수 필수 |
| 토큰 비용 | 개요 승인 단계로 50-70% 절감, 결과 캐싱 |
| 품질 | "AI가 쓴 티" 나는 문구 후처리로 제거 |

### 9.2 플랫폼 정책

| 항목 | 대응 |
|------|------|
| 스팸 처리 | 너무 빈번한 발행 방지, 랜덤 딜레이 적용 |
| 저작권 | 원본 출처 명시, 재작성 시 표절 체크 |
| YouTube 정책 | API 허용 범위 내 자막 추출 |

### 9.3 보안

| 항목 | 대응 |
|------|------|
| API 키 | 환경 변수 관리, 클라이언트 노출 금지 |
| XSS | 마크다운 렌더링 시 DOMPurify 사용 |
| Rate Limiting | AI API 호출 및 인증 시도 제한 |
| CSRF | 상태 변경 요청에 토큰 검증 |

### 9.4 성능

| 항목 | 대응 |
|------|------|
| AI 호출 | 스트리밍 응답, 결과 캐싱 |
| 이미지 | Next.js Image, WebP 변환 |
| DB | N+1 방지, 인덱스 설계 |

---

## 10. 참고 자료

- Council 의견 수집 결과 (Claude, Gemini)
- 2024-01-17 설계 논의

---

*Last Updated: 2026-01-17*
