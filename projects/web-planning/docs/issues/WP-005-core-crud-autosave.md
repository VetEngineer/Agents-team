# WP-005 Core CRUD APIs + autosave

## Priority
P0

## Summary
Implement core CRUD APIs for projects, answers, pages, and sections with autosave support.

## Scope
- CRUD for projects, pages, and page sections.
- Create/update project answers from survey steps.
- CRUD for styles, functions, references, and assets.
- Autosave endpoints with a client-side debounce policy.

## Acceptance Criteria
- Core entities can be created, updated, and queried.
- Autosave persists changes without full submit.
- API uses auth context and respects RLS.

## Dependencies
- WP-001 Supabase foundation (migrations + RLS)

## References
- `projects/web-planning/docs/plan.md`
- `projects/web-planning/docs/ui-flow.md`
