# WP-003 Storage buckets + upload validation

## Priority
P0

## Summary
Set up storage buckets and implement server-side file validation for required assets.

## Scope
- Create storage buckets and folder conventions per project.
- Seed or reference `asset_requirements` for mandatory uploads.
- Validate file type, size, and dimensions after upload.
- Record pass/fail status and validation notes per asset.

## Acceptance Criteria
- Uploads land in project-scoped storage paths.
- Invalid files are flagged with a clear reason.
- Asset records include spec check results and notes.

## Dependencies
- WP-001 Supabase foundation (migrations + RLS)

## References
- `projects/web-planning/docs/plan.md`
- `projects/web-planning/docs/ui-spec.md`
