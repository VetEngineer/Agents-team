# WP-002 Kakao OAuth + guest draft migration

## Priority
P0

## Summary
Implement Kakao OAuth and support guest drafts that are migrated to a user account on sign-in.

## Scope
- Kakao OAuth integration via Supabase auth.
- Guest draft mode stored locally (localStorage or IndexedDB).
- On sign-in, create or attach a project and migrate guest data.
- Clear guest draft after successful migration.
- Block submit until sign-in is complete.

## Acceptance Criteria
- Users can sign in with Kakao and create projects.
- Guest draft survives reloads and can be edited before sign-in.
- After sign-in, the guest draft becomes an owned project and local draft is cleared.
- Submit is blocked for unauthenticated users with a clear prompt.

## Dependencies
- WP-001 Supabase foundation (migrations + RLS)

## References
- `projects/web-planning/docs/ui-flow.md`
- `projects/web-planning/docs/plan.md`
- `projects/web-planning/docs/tech-stack.md`
