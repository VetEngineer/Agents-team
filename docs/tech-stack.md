# 기술 스택 정리

## 목표
- 설문+웹빌더 방식의 웹기획서 수집
- RDB 기반 자동화 연계(Airtable/Notion/Sheets)
- 에이전시 대시보드 운영

## 권장 스택(초안)
- Frontend: Next.js + React + TypeScript
- UI: Tailwind CSS (또는 shadcn/ui)
- Backend: Supabase(PostgreSQL) + Edge Functions
- Auth: 카카오 로그인(Supabase OAuth)
- Storage: Supabase Storage
- Automation: Supabase Webhooks → Airtable/Notion/Sheets/알림
- Email: Resend 또는 SendGrid
- Slack/Telegram: Webhook 기반

## 인프라/운영
- Hosting: Vercel
- 환경 변수: Vercel Env + Supabase Secrets
- 로그: Supabase 로그 + 별도 sync_logs 테이블

## 데이터
- RDB 스키마: projects/pages/sections/answers/assets
- 템플릿 관리: question_templates/asset_requirements
- 동기화 대상: Airtable(우선), Notion/Sheets(확장)

## 보안/권한
- 사용자: owner(일반), agency, admin
- RLS 정책: 프로젝트 소유자 접근 제한
- 업로드 파일: 프로젝트별 버킷/폴더 분리

## 결정 기록
- DB: Supabase(PostgreSQL)
- Auth: 카카오 로그인 기본
- Dashboard: Airtable 우선
- 알림: 메일/Slack/Telegram

---

메모: 이 문서는 스택 변경 시 업데이트합니다.
