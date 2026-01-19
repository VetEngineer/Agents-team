# UI/UX Design Guidance (Material 3)

## 방향
- 기준: Google Material 3
- 톤: 밝고 정돈된 워크스페이스, 명확한 단계 안내
- 목표: 설문+빌더 흐름을 빠르고 직관적으로 완성

## 레이아웃
- 데스크톱: 좌측 네비게이션 레일 + 중앙 콘텐츠
- 모바일: 하단 네비게이션 바, 단일 컬럼 중심
- 진행률: 상단 선형 Progress + 자동 저장 상태

## 컬러/서페이스
- Seed Color: Deep Indigo(#3F51B5) 또는 Teal(#009688)
- Surface 톤: 약간의 틴트로 계층 표현, 과도한 그림자 지양
- Primary: 주요 CTA/제출/생성 버튼
- Secondary/Tonal: 보조 액션(임시 저장, 미리보기)

## 타이포그래피
- 기본: Roboto
- 계층: Headline(섹션 제목), Body(입력 설명), Label(버튼)

## 컴포넌트 가이드
- 버튼: Filled(주요), Outlined(보조), Tonal(보조)
- 입력: Outlined Text Field + Floating label
- 토글: Switch, Checkbox, Radio
- 피드백: Snackbar(저장/오류), Inline error

## 화면별 컴포넌트 스펙(요약)
### 공통
- App Bar: 프로젝트명, 저장 상태, 나가기
- Progress: Linear Progress(상단)
- Card: 섹션/질문 묶음, Elevation은 Surface 톤으로 구분
- Dialog: 삭제/중요 확인에만 사용

### 사용자 설문
- Question Card: 제목/설명/입력 컴포넌트/예시 토글
- Section Divider: 단계별 구분선
- CTA Selector: Segmented Buttons(전화/카카오/예약/문의/지도/직접입력)
- Helper Text: 입력 하단에 간결한 가이드/에러 표시

### 페이지/섹션 빌더
- Page List: List + Add 버튼
- Section Card: 드래그 핸들 + 타입 배지 + 요약
- Properties Panel: 슬라이드 패널(Desktop), 바텀시트(Mobile)
- Drag Feedback: 드롭 타겟 하이라이트

### 파일 업로드
- Upload Card: 제목/필수 여부/규격 토글/업로드 버튼
- Status Chip: 통과/미달/보완 요청
- Inline Warning: 미달 시 고정 표시

### 관리자 템플릿 편집
- Template List: 질문 카드 + 드래그 정렬
- Edit Panel: 제목/설명/타입/필수/업종 분기/표시 조건
- Option Editor: 선택지 추가/삭제

## 설문 UI
- 각 질문은 카드/섹션 단위로 묶음
- 도움말/예시는 토글로 노출
- 입력 단위 간 충분한 여백

## 페이지/섹션 빌더
- 페이지 리스트 + 페이지 상세 패널
- 섹션 카드 드래그 정렬
- 섹션 편집은 슬라이드 패널 또는 모달
- CTA는 세그먼트 버튼(전화/카톡/예약/문의/지도/직접입력)

## 파일 업로드 UX
- 항목별 카드
- "규격 보기" 토글로 조건 표시
- 업로드 후: 통과/미달 배지
- 미달 시 보완 안내 메시지 고정 표시

## 관리자 질문 템플릿 편집
- 좌측 섹션 리스트, 우측 질문 리스트
- 질문 카드 드래그 순서 변경
- 편집 패널: 제목/설명/타입/필수/업종 분기/표시 조건

## 상태/피드백
- Hover/Pressed: 상태 레이어(8%/12%)
- 저장 성공/실패: Snackbar

## 결정 기록
- Material 3 준수
- Navigation Rail/Bottom Bar 적용
- Surface 톤 기반 계층

---

메모: 이 문서는 디자인 방향 변경 시 업데이트합니다.
