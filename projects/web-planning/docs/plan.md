# 프로젝트 기획/개발 플랜 (자동 기록)

## 개요
- 목표: 소상공인/개인창업자/전문직이 설문+빌더 방식으로 웹기획서를 작성하면, 에이전시가 바로 제작 가능한 수준의 정보가 RDB에 저장되고 Airtable/Notion/Sheets로 전달되는 웹앱 구축
- 최종 산출물: Notion 페이지 + Google Sheets 기록 + Airtable 대시보드(우선)
- 데이터 저장: Supabase(PostgreSQL) RDB
- 로그인: 카카오 로그인 기본
- 파일 업로드: 필수(로고/배너/서비스 이미지 등 홈페이지 제작 필수 자산)
- 전달/알림: 이메일/Slack/Telegram
  - 주석: 필요 시 multi-agent 의견 수렴은 agent-council 사용

## 핵심 사용자
- 소상공인, 개인 창업자, 전문직(의사/변호사 등)

## 핵심 기능
- 단계형 설문 + 페이지/섹션 빌더(+버튼)
- 자동 저장(입력 즉시 DB 저장)
- 질문 템플릿 관리자 편집 가능
- 업종별 질문 분기 지원
- 필수 파일 업로드 및 규격 검증
- Airtable 동기화(에이전시 대시보드)
- Notion/Sheets 생성 및 링크 전달

## UX 흐름(사용자)
1) 카카오 로그인
  - 주석(스킬/에이전트): 인증/가입 이슈, 전환율 개선 논의는 agent-council
2) 프로젝트 생성
  - 주석(스킬/에이전트): 온보딩 단계 축소/확장 논의는 agent-council
3) 기본 정보/브랜드/타깃/메뉴 입력
  - 주석(스킬/에이전트): 질문 수/난이도 조정은 agent-council
4) 페이지 빌더(페이지 추가 → 섹션 추가 → 카피/CTA 작성)
  - 주석(스킬/에이전트): 빌더 구조/편집 UX 재검토는 agent-council
5) 스타일/기능/반응형 입력
  - 주석(스킬/에이전트): 옵션 표준화/프리셋 논의는 agent-council
6) 레퍼런스 입력
  - 주석(스킬/에이전트): 레퍼런스 분류/품질 기준 논의는 agent-council
7) 필수 파일 업로드(규격 안내 포함)
  - 주석(스킬/에이전트): 업종별 파일 요구 변경 시 agent-council
8) 제출 완료 → 자동 전달
  - 주석(스킬/에이전트): UX 흐름 변경이 필요하면 agent-council로 다중 의견 수렴

## UX 흐름(관리자)
- 질문 템플릿 관리(문구/필수/순서/업종 분기/표시 조건)
  - 주석(스킬/에이전트): 템플릿 변경 정책/버전관리 논의는 agent-council
- 업로드 요구사항 관리(규격/설명/필수 여부)
  - 주석(스킬/에이전트): 파일 요구사항 표준화 논의는 agent-council
- Airtable 연동 상태/로그 확인
  - 주석(스킬/에이전트): 관리자 UX/권한 정책 논의 시 agent-council 사용 고려

## 데이터 모델 요약(Supabase)
- users
- projects
- question_templates
- project_answers
- pages
- page_sections
- styles
- functions
- references
- assets
- asset_requirements
  - 주석(스킬/에이전트): 스키마 리스크/정규화 논의가 필요하면 agent-council 사용

## 질문 템플릿 관리 방식
- question_templates 테이블 기반
- 관리자 페이지에서 CRUD
- 업종별 분기: industry_tags
- 표시 조건: 선행 질문 기반 조건 필드
- 변경 시 진행 중 설문은 "현재 단계부터 적용"
  - 주석(스킬/에이전트): 복잡한 분기 규칙/노출 정책은 agent-council 검토 권장

## 파일 업로드 요구사항(필수)
- 로고: AI 또는 SVG 필수, PNG 보조(투명, 2000px 이상)
- 메인 배너: 1920px 이상, JPG/PNG
- 서비스 이미지: 가로 1200px 이상, JPG/PNG
- 공간/시설/인물 사진: 업종 해당 시 필수
- 후기/사례 자료: 텍스트/이미지, 개인정보 마스킹 안내
- 브랜드 컬러/가이드: HEX 또는 PDF
- CTA 연결 정보: 전화/카카오/예약/문의/지도 중 선택
  - 주석(스킬/에이전트): 업종별 파일 요구사항 확장 시 agent-council 참고

## Airtable 연동
- 단방향 동기화(Supabase → Airtable)
- 테이블: Projects, Pages, Sections, Assets, References
- 뷰: 신규 접수, 파일 미비, 업종별, 진행중
  - 주석(스킬/에이전트): 연동 구조 재설계 필요 시 agent-council 사용 고려
  - 주석(스킬/에이전트): 양방향 동기화 도입 논의는 agent-council

## 알림/전달
- 제출 시 이메일/Slack/Telegram 알림
- Notion/Sheets 링크 포함
  - 주석(스킬/에이전트): 알림 정책/템플릿 정교화 시 agent-council 참고
  - 주석(스킬/에이전트): 채널별 메시지 분기 기준 논의는 agent-council

## 관리자 UI 설계 요약
- 탭: 질문 템플릿 / 업로드 요구사항 / 동기화 / 로그 / 설정
- 좌측 섹션 리스트, 우측 질문 리스트 + 편집 패널
- 업로드 항목별 규격/가이드 미리보기 제공
  - 주석(스킬/에이전트): 관리자 UI 구조 변경 시 agent-council 사용 고려
  - 주석(스킬/에이전트): 운영자 역할 분리(뷰/수정/승인) 논의는 agent-council

## 사용자 설문 UI 설계 요약
- 좌측 단계/우측 폼
- 상단 진행률 + 자동 저장 표시
- 페이지 빌더 내 페이지/섹션 드래그 정렬
- 업종별 예시는 "예시 보기"로 노출
  - 주석(스킬/에이전트): 설문 UX 개선 논의 시 agent-council 사용 고려
  - 주석(스킬/에이전트): 모바일 최적화/입력 편의 개선 논의는 agent-council

## 결정 기록
- DB: Supabase(PostgreSQL)
- Auth: 카카오 로그인
- Airtable 우선 연동
- 질문 문구: 친절한 안내형
- 질문 템플릿은 관리자 페이지에서 수정 가능
- 파일 규격 검증은 업로드 후 서버에서 수행
- 워크플로우: claude 브랜치(백엔드/코어), gemini 브랜치(디자인), codex PR 리뷰

## 운영 절차(브랜치/PR/이슈)
- 브랜치
  - main: 보호 브랜치, Codex만 머지
  - claude: 백엔드/코어 기능
  - gemini: 프론트엔드 디자인
- 이슈
  - 작업 전 반드시 이슈 생성/할당
  - 라벨: bug, risk, design, missing-test
  - 이슈 범위 밖 작업 금지
- PR
  - PR은 단일 이슈 범위만 포함
  - Codex가 엄격 리뷰(버그/리스크/테스트 우선)
  - 문제 발견 시 Issue 생성 → 담당자 해결 후 재리뷰
  - 승인 후 main 머지

## 작업 배치(초기)
- Claude(backend/core, claude 브랜치)
  - Supabase 프로젝트/스키마 마이그레이션
  - Auth(카카오) 설정/콜백 플로우
  - CRUD API(프로젝트/답변/페이지/섹션/파일)
  - Airtable 동기화(단방향) + sync_logs
  - RLS 정책/권한 구조
- Gemini(frontend design, gemini 브랜치)
  - Material 3 디자인 시스템 반영
  - 사용자 설문 UI/페이지 빌더 화면
  - 파일 업로드 UI/검증 피드백
  - 관리자 템플릿 편집 UI
- Codex(main)
  - PR 엄격 리뷰 + Issue 생성
  - 문서 업데이트 확인(설계/디자인)

## Council 결과 요약
- gemini 응답은 다른 프로젝트(BrandBlog AI) 맥락으로 확인되어 본 프로젝트에는 미반영

## 체크리스트(개발자가 검토)
- [ ] Supabase 프로젝트 세팅 및 DB 마이그레이션
  - 주석(스킬/에이전트): 스키마 리뷰가 필요하면 agent-council
- [ ] 카카오 로그인 연동
  - 주석(스킬/에이전트): 인증 플로우 이슈 발생 시 agent-council
- [ ] 질문 템플릿 CRUD 및 관리자 UI
  - 주석(스킬/에이전트): 템플릿 구조/권한 논의 시 agent-council
- [ ] 업종 분기 + 표시 조건 처리
  - 주석(스킬/에이전트): 복잡 규칙 설계 시 agent-council
- [ ] 페이지/섹션 빌더(동적 추가/정렬)
  - 주석(스킬/에이전트): 빌더 UX/구조 재검토 시 agent-council
- [ ] 파일 업로드 + 규격 검증 + 안내 텍스트
  - 주석(스킬/에이전트): 업로드 정책 확장 시 agent-council
- [ ] Airtable 동기화(단방향)
  - 주석(스킬/에이전트): 동기화/스키마 매핑 재검토 시 agent-council
- [ ] Notion/Sheets 생성 및 링크 저장
  - 주석(스킬/에이전트): 문서 템플릿 논의 시 agent-council
- [ ] 알림(메일/Slack/Telegram)
  - 주석(스킬/에이전트): 메시지 정책 정교화 시 agent-council
- [ ] 제출 완료 플로우 및 에이전시 전달 확인
  - 주석(스킬/에이전트): 운영 플로우 개선 필요 시 agent-council
  - 주석(스킬/에이전트): 반복 작업 자동화가 필요하면 skill-creator
  - 주석(스킬/에이전트): 외부 스킬 설치 필요 시 skill-installer

## 디자인 적용 체크리스트(Material 3)
- [ ] Navigation Rail(Desktop) / Bottom Bar(Mobile) 적용
- [ ] Surface 톤 계층(배경/카드/패널) 구분
- [ ] Primary/Secondary/Tonal 버튼 역할 분리
- [ ] Outlined Text Field + Floating Label 적용
- [ ] Progress + 자동 저장 상태 표시
- [ ] Snackbar 피드백(저장/오류) 적용
- [ ] 질문/섹션 카드 간 충분한 여백 확보
- [ ] 파일 업로드 규격 토글/통과·미달 배지 표시
- [ ] 페이지/섹션 빌더 드래그 정렬 UX 반영

## Skills/Agents 주석
- agent-council: 설계/리스크/우선순위에 대한 다중 AI 의견이 필요할 때 사용
- skill-creator: 반복적인 운영/자동화 절차를 스킬로 묶고 싶을 때 사용
- skill-installer: 다른 레포/리스트의 스킬을 가져와 적용할 때 사용

## 변경 로그
- 2025-02-14: 초기 요구사항/설계/체크리스트 작성
- 2025-02-14: Material 3 기반 UI/UX 가이드 문서 추가(docs/design.md)
- 2025-02-14: web-planning 앱 스캐폴딩 생성

---

메모: 이 문서는 대화 내용이 업데이트될 때마다 수정/추가 기록합니다.
