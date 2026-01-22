# WP-004 Project snapshots on submit

## Priority
P0

## Summary
Generate a versioned project snapshot payload at submit time for exports.

## Scope
- Build snapshot payload from current project state.
- Store the snapshot in `project_snapshots` when a project is submitted.
- Increment snapshot version per submit.
- Update project status to `submitted` and record submission time.

## Acceptance Criteria
- Submitting a project creates a snapshot row with a JSON payload.
- Snapshot payload matches the MVP schema.
- Project status changes to `submitted` after snapshot creation.
- Snapshot versions increment without overwriting prior snapshots.

## Dependencies
- WP-001 Supabase foundation (migrations + RLS)
- WP-005 Core CRUD APIs + autosave

## References
- `projects/web-planning/docs/data-model.md`
- `projects/web-planning/docs/plan.md`
