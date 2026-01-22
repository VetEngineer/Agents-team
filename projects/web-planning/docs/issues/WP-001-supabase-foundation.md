# WP-001 Supabase foundation (migrations + RLS)

## Priority
P0

## Summary
Audit and finalize Supabase migrations and RLS so owner/agency/admin access is consistent and safe.

## Scope
- Review existing migrations under `supabase/migrations` for core tables.
- Ensure core tables exist: users, projects, question_templates, project_answers, pages, page_sections, styles, functions, references, assets, asset_requirements, project_snapshots, sync_jobs, sync_logs.
- Confirm role model uses `users.role` with helper functions `is_admin()` / `is_agency()`.
- Verify RLS policies cover select/insert/update/delete for core tables.
- Document agency access rules (global access vs assigned projects) and add mapping table only if needed.

## Acceptance Criteria
- `supabase db reset` applies all migrations cleanly on a fresh project.
- Owners can CRUD only their own project data.
- Agency access behavior is explicitly documented and matches RLS.
- Admin can access all project data.
- Anonymous users cannot read or write protected tables.

## Dependencies
- None

## References
- `projects/web-planning/docs/plan.md`
- `projects/web-planning/docs/tech-stack.md`
- `projects/web-planning/docs/data-model.md`
