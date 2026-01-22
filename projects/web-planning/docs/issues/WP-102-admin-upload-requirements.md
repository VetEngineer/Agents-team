# WP-102 Admin upload requirements CRUD

## Priority
P1

## Summary
Provide admin UI to manage asset requirements and validation rules.

## Scope
- CRUD for asset requirements (formats, min size, required).
- Helper text and preview for each requirement.
- Ordering and grouping support.

## Acceptance Criteria
- Admin can add/edit/delete requirements.
- Requirements drive the upload step UI.
- Changes apply to new projects without breaking existing data.

## Dependencies
- WP-001 Supabase foundation (migrations + RLS)
- WP-003 Storage buckets + upload validation

## References
- `projects/web-planning/docs/ui-spec.md`
- `projects/web-planning/docs/plan.md`
