# 대시보드 HTML 템플릿

hakhamAI 프로젝트 대시보드를 생성할 때 참조하는 가이드 문서다.
단일 HTML 파일로, 브라우저에서 바로 열 수 있다.

---

## Section A: 데이터 추출 프로토콜

대시보드에 표시할 데이터를 어떤 파일에서 추출하는지 정의한다.

### 파일 → 데이터 매핑

| 데이터 항목 | 소스 파일 경로 | 추출 방법 |
|---|---|---|
| 프로젝트코드 | `output/{code}/` 디렉토리명 | 디렉토리명 파싱 |
| 상호명 | `output/{code}/brief/*.md` | `**상호명**:` 뒤의 값 |
| 업종 | `output/{code}/brief/*.md` | `**업종/카테고리**:` 뒤의 값 |
| 지역 | `output/{code}/brief/*.md` | `**지역(내원권/상권)**:` 뒤의 값 |
| 핵심 서비스 | `output/{code}/brief/*.md` | `**핵심 서비스 3개**:` 이하 1~3번 항목 |
| 목표 | `output/{code}/brief/*.md` | `**목표(우선순위 순으로)**:` 이하 항목 |
| 예산 | `output/{code}/brief/*.md` | `**월 예산**:` 이하 합계 |
| 컴플라이언스 | `output/{code}/brief/*.md` | `**컴플라이언스 제약**:` 이하 항목 |
| 팀 운영모드 | `output/{code}/plan/execution_plan_7d_v1.0.md` | 각 팀의 운영모드 (`풀가동`/`축소`/`핵심선행`/`미실행`) |
| 주 KPI | `output/{code}/plan/execution_plan_7d_v1.0.md` | `주 KPI` 섹션 (이름, 현재값, 목표값) |
| 보조 KPI | `output/{code}/plan/execution_plan_7d_v1.0.md` | `보조 KPI` 섹션 |
| 페르소나 | `output/{code}/T01/persona_cards.md` | 페르소나 이름, 연령, 상황 요약 |
| 오퍼 3단계 | `output/{code}/T01/offer_tiers.md` | 3단 오퍼 이름과 가격대 |
| 핵심 메시지 | `output/{code}/T02/message_system.md` | 브랜드 약속, 핵심 메시지 1줄 |
| 헤드라인 상위 3개 | `output/{code}/T02/copy_bank_headlines.md` | 상위 3개 헤드라인 |
| 키워드 클러스터 | `output/{code}/T03/keyword_clusters.md` | 클러스터명 + 키워드 수 |
| 콘텐츠 캘린더 요약 | `output/{code}/T03/content_calendar_4w.md` | 주차별 발행 수 합계 |
| 스크립트 수 | `output/{code}/T04/scripts_10.md` | 대본 개수 카운트 |
| 포맷 유형 | `output/{code}/T04/recurring_formats.md` | 포맷 이름 목록 |
| 캠페인 구조 | `output/{code}/T05/campaign_structure.md` | 캠페인명, 채널, 일예산 |
| CPL 목표 | `output/{code}/T05/campaign_structure.md` | 목표 CPL 값 |
| KPI 정의 | `output/{code}/T06/kpi_definitions.md` | KPI 이름, 정의, 목표 |
| 측정 체크리스트 | `output/{code}/T06/measurement_checklist.md` | 완료/미완료 항목 수 |
| QA 결과 | `output/{code}/T*/` 내 QA 관련 파일 또는 별도 QA 리포트 | Pass/Revise/Reject 판정 |

### 파일 존재 확인 규칙

각 팀 산출물 디렉토리의 파일 존재 여부를 체크하여 아래 상태를 부여한다:

| 상태 | 조건 | 배지 색상 |
|---|---|---|
| 완료 | 해당 팀 디렉토리에 산출물 파일 1개 이상 존재 | 초록 |
| 미생성 | 해당 팀 디렉토리가 없거나 비어 있음 | 회색 |

---

## Section B: HTML 템플릿 스켈레톤

아래 템플릿의 `{{PLACEHOLDER}}`를 실제 데이터로 교체하여 HTML 파일을 생성한다.

```html
<!DOCTYPE html>
<html lang="ko" x-data="dashboard()" :class="{ 'dark': darkMode }">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>hakhamAI Dashboard - {{PROJECT_CODE}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: { sans: ['Pretendard', 'system-ui', 'sans-serif'] }
        }
      }
    }
  </script>
  <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    [x-cloak] { display: none !important; }
  </style>
</head>
<body class="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors">

  <!-- HEADER -->
  <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold">{{PROJECT_CODE}}</h1>
        <span class="text-sm text-gray-500 dark:text-gray-400">{{BUSINESS_NAME}}</span>
        <span class="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">{{INDUSTRY}}</span>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-xs text-gray-400">{{GENERATED_DATE}}</span>
        <button @click="darkMode = !darkMode" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <span x-show="!darkMode">&#x1F319;</span>
          <span x-show="darkMode">&#x2600;&#xFE0F;</span>
        </button>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 py-6 space-y-6">

    <!-- KPI CARDS -->
    <section class="grid grid-cols-1 md:grid-cols-3 gap-4">
      {{KPI_CARDS}}
      <!--
      각 KPI 카드 구조:
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{KPI_NAME}}</p>
        <p class="text-3xl font-bold mt-1">{{KPI_CURRENT}}</p>
        <div class="mt-3">
          <div class="flex justify-between text-xs text-gray-400 mb-1">
            <span>현재</span><span>목표 {{KPI_TARGET}}</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div class="bg-blue-500 h-2 rounded-full" style="width: {{KPI_PERCENT}}%"></div>
          </div>
        </div>
      </div>
      -->
    </section>

    <!-- PROJECT OVERVIEW -->
    <section x-data="{ open: true }">
      <button @click="open = !open" class="w-full flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-6 py-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold">프로젝트 개요</h2>
        <span x-text="open ? '&#x25B2;' : '&#x25BC;'" class="text-gray-400"></span>
      </button>
      <div x-show="open" x-cloak class="bg-white dark:bg-gray-800 rounded-b-xl px-6 pb-6 border-x border-b border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          {{PROJECT_OVERVIEW_ITEMS}}
          <!--
          각 항목 구조:
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wide">{{LABEL}}</p>
            <p class="mt-1">{{VALUE}}</p>
          </div>
          -->
        </div>
      </div>
    </section>

    <!-- EXECUTION STATUS GRID -->
    <section x-data="{ open: true }">
      <button @click="open = !open" class="w-full flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-6 py-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold">실행 현황</h2>
        <span x-text="open ? '&#x25B2;' : '&#x25BC;'" class="text-gray-400"></span>
      </button>
      <div x-show="open" x-cloak class="bg-white dark:bg-gray-800 rounded-b-xl px-6 pb-6 border-x border-b border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          {{TEAM_STATUS_CARDS}}
          <!--
          각 팀 카드 구조:
          <div class="rounded-lg p-4 text-center border {{TEAM_BORDER_COLOR}}">
            <p class="font-semibold text-sm">T0{{N}}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{TEAM_NAME}}</p>
            <span class="inline-block mt-2 px-2 py-0.5 text-xs rounded-full {{TEAM_MODE_COLOR}}">{{TEAM_MODE}}</span>
            <div class="mt-2 flex justify-center gap-1">
              산출물 파일별: &#x2713; 또는 &#x2717;
            </div>
          </div>
          -->
        </div>
      </div>
    </section>

    <!-- TEAM SECTIONS (T01~T06) -->
    {{TEAM_DETAIL_SECTIONS}}
    <!--
    각 팀 섹션 구조:
    <section x-data="{ open: false }">
      <button @click="open = !open" class="w-full flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-6 py-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <span class="px-2 py-1 text-xs font-mono rounded {{TEAM_MODE_COLOR}}">T0{{N}}</span>
          <h2 class="text-lg font-semibold">{{TEAM_TITLE}}</h2>
        </div>
        <span x-text="open ? '&#x25B2;' : '&#x25BC;'" class="text-gray-400"></span>
      </button>
      <div x-show="open" x-cloak class="bg-white dark:bg-gray-800 rounded-b-xl px-6 pb-6 border-x border-b border-gray-200 dark:border-gray-700 space-y-4 pt-4">
        {{TEAM_HIGHLIGHT_CONTENT}}
      </div>
    </section>
    -->

    <!-- QA STATUS -->
    <section x-data="{ open: false }">
      <button @click="open = !open" class="w-full flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl px-6 py-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold">품질 검수 현황</h2>
        <span x-text="open ? '&#x25B2;' : '&#x25BC;'" class="text-gray-400"></span>
      </button>
      <div x-show="open" x-cloak class="bg-white dark:bg-gray-800 rounded-b-xl px-6 pb-6 border-x border-b border-gray-200 dark:border-gray-700">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          {{QA_STATUS_BADGES}}
          <!--
          각 팀 QA 배지:
          <div class="text-center p-3 rounded-lg {{QA_BG_COLOR}}">
            <p class="font-semibold text-sm">T0{{N}}</p>
            <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded-full {{QA_BADGE_COLOR}}">{{QA_RESULT}}</span>
          </div>
          QA_RESULT: Pass / Revise / Reject / 미검수
          -->
        </div>
      </div>
    </section>

  </main>

  <!-- FOOTER -->
  <footer class="max-w-7xl mx-auto px-4 py-6 text-center text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-700 mt-8">
    Generated by hakhamAI | {{GENERATED_TIMESTAMP}}
  </footer>

  <script>
    function dashboard() {
      return {
        darkMode: localStorage.getItem('hakham-dark') === 'true',
        init() {
          this.$watch('darkMode', val => localStorage.setItem('hakham-dark', val))
        }
      }
    }
  </script>

</body>
</html>
```

---

## Section C: 생성 규칙

### 1. 미존재 파일 처리

| 상황 | 처리 |
|---|---|
| 브리프 파일 없음 | 대시보드 생성 불가. "먼저 브리프를 작성하세요." 안내 |
| 실행 계획 파일 없음 | KPI 카드와 팀 운영모드를 "미설정"으로 표시 |
| 팀 산출물 디렉토리 없음 | 해당 팀 섹션을 "미생성" 회색 배지로 표시, 상세 내용 비움 |
| 팀 산출물 일부 파일 없음 | 존재하는 파일만 데이터 추출, 없는 항목은 "-" 표시 |
| QA 결과 없음 | "미검수" 회색 배지 |

### 2. 색상 매핑 (Tailwind 클래스)

| 상태 | 라이트 모드 | 다크 모드 |
|---|---|---|
| Pass / 풀가동 | `bg-green-100 text-green-800` | `bg-green-900 text-green-200` |
| Revise / 축소 | `bg-yellow-100 text-yellow-800` | `bg-yellow-900 text-yellow-200` |
| Reject / 미실행 | `bg-red-100 text-red-800` | `bg-red-900 text-red-200` |
| 핵심선행 | `bg-blue-100 text-blue-800` | `bg-blue-900 text-blue-200` |
| 미검수 / 미생성 | `bg-gray-100 text-gray-500` | `bg-gray-800 text-gray-400` |

### 3. 팀별 하이라이트 내용

| 팀 | 표시 항목 |
|---|---|
| T01 | 페르소나 카드 (이름 + 상황 1줄), 오퍼 3단계 (이름 + 가격대) |
| T02 | 핵심 메시지 1줄, 상위 헤드라인 3개, 반론 처리 수 |
| T03 | 키워드 클러스터 배지 (이름 + 키워드 수), 콘텐츠 캘린더 주차별 요약 |
| T04 | 스크립트 수, 포맷 유형 목록, 게시 캘린더 기간 |
| T05 | 캠페인 구조 (이름/채널/예산), CPL 목표, 실험 건수 |
| T06 | KPI 정의 수, 측정 체크리스트 완료율 (%), 인사이트 수 |

### 4. 반응형 규칙

| 브레이크포인트 | 레이아웃 |
|---|---|
| 모바일 (< 768px) | 1열, 카드 풀 와이드 |
| 태블릿 (768px~1024px) | 2~3열 그리드 |
| 데스크톱 (> 1024px) | 3~6열 그리드 |

### 5. 접기/펼치기 기본 상태

| 섹션 | 기본 상태 |
|---|---|
| KPI 카드 | 항상 표시 |
| 프로젝트 개요 | 펼침 |
| 실행 현황 그리드 | 펼침 |
| T01~T06 상세 | 접힘 |
| 품질 검수 현황 | 접힘 |

### 6. 저장 경로

```
output/{프로젝트코드}/dashboard.html
```
