# 보안을 고려한 배포 절차 계획

## 목적
- 안전하게 배포하고, 인증/권한/데이터 보호를 우선하는 운영 절차를 정의한다.

## 범위
- 대상: Web Planning 앱(Next.js + Supabase)
- 환경: 개발/스테이징/프로덕션 분리

## 배포 전 준비
### 1) 환경 분리
- Supabase 프로젝트를 환경별로 분리한다(dev/staging/prod).
- 각 환경은 별도 DB/스토리지/키를 사용한다.

### 2) 권한 모델 확정
- RLS 정책을 모든 테이블에 적용한다.
- `service_role` 키는 서버에서만 사용한다.
- 클라이언트는 `anon` 키만 사용한다.

### 3) 비밀 관리
- `.env` 파일은 커밋 금지.
- Vercel Env 또는 Supabase Secrets에만 저장.
- 키는 정기적으로 회전(회전 주기 문서화).

## 배포 파이프라인(권장)
1) 브랜치 정책
   - `main`: 배포 전용
   - `staging`: 사전 검증용
2) CI 체크
   - `npm run lint`
   - `npm run build`
3) 마이그레이션 적용
   - Supabase CLI로 migrations 적용
   - 적용 후 RLS 정책 점검
4) 배포
   - Vercel에 배포(환경 변수 연결)
5) 배포 후 검증
   - 카카오 로그인/세션 생성 확인
   - 프로젝트 생성/자동저장/조회 확인
   - 권한 테스트: 타 사용자 데이터 접근 차단 확인

## 보안 체크리스트
- [ ] RLS가 모든 테이블에 활성화되어 있는가
- [ ] 서비스 롤 키가 클라이언트에 노출되지 않는가
- [ ] 카카오 OAuth Redirect URI가 정확히 등록되었는가
- [ ] `/api/*` 라우트에 인증/권한 검증이 있는가
- [ ] 업로드 파일은 프로젝트별 경로로 격리되는가
- [ ] 민감 정보가 로그에 남지 않는가

## 운영 및 모니터링
- 오류 추적(Sentry 등) 도입
- Supabase 로그 및 `sync_logs` 점검
- 성능/비용 모니터링(쿼리/스토리지/외부 API)

## 사고 대응/롤백
- 문제 발생 시 즉시 배포 롤백(이전 빌드로)
- 마이그레이션은 되돌릴 수 있는 방식으로 작성
- 키 유출 의심 시 즉시 회전 및 로그 점검

## 참고 문서
- `projects/web-planning/docs/plan.md`
- `projects/web-planning/docs/tech-stack.md`
- `projects/web-planning/docs/data-model.md`
