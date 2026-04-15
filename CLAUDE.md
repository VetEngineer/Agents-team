# CLAUDE.md — Agents-team

## Project Overview

**Hakham 에이전트 팀** — SN-secretary-mk1, cc-system, voice-sync-prompter-SaaS 등
내부 자동화 에이전트 집합체 monorepo. 각 서브 디렉터리가 독립된 에이전트 프로젝트.

## Structure

```
Agents-team/
  apps/                   # cc-system 등 공유 앱 설정
  SN-secretary-mk1/       # Slack/Notion 비서 에이전트
  cc-system/              # 콘텐츠 큐레이션 시스템
  Voice-sync prompter/    # 음성 싱크 프롬프터 (standalone)
  voice-sync-prompter-SaaS/ # SaaS 버전
  hakham-agency/          # 에이전시 자동화
  keyword-generator/      # 키워드 생성 에이전트
  projects/               # 개별 프로젝트 참조
  docs/                   # 에이전트 설계 문서
  AGENTS-BOUNDARY.md      # 에이전트 역할 경계 정의
```

## Commands

```bash
# 루트 (모노레포 스크립트)
npm run dev       # 개발 서버

# 각 서브 에이전트는 개별 디렉터리에서 실행
cd SN-secretary-mk1 && npm run dev
cd cc-system && npm run dev
```

## Conventions

- **AGENTS-BOUNDARY.md 필독**: 각 에이전트 역할 경계가 명확히 정의되어 있음
- 서브 에이전트 간 직접 호출 금지 — 메시지 큐/이벤트 버스로 통신
- 각 서브 디렉터리는 독립적으로 배포 가능해야 함
- `plan.md` / `log.md` 에 현재 진행 상황과 결정사항 기록됨

## Known Gotchas

- `Voice-sync prompter/` 는 공백 포함 디렉터리명 — 경로 따옴표 주의
  ```bash
  cd "Voice-sync prompter"
  ```
- 서브모듈 변경 사항 5개 미커밋 상태 (`.gitmodules` 확인 필요)
- N8n 워크플로우는 Synology NAS에서 운영 (로컬 Docker 사용 금지)

## 컨텍스트 관리

sub-agent를 최대한 활용해서 컨텍스트를 평균 40%, 최대 60%를 넘지 않도록 관리한다.
