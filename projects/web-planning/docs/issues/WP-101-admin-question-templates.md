# WP-101 Admin question templates CRUD

## Priority
P1

## Summary
Build admin tooling to manage question templates, branching, and ordering.

## Scope
- CRUD for question templates with sections and ordering.
- Industry tags and show-if conditions.
- Drag-and-drop reorder in the admin UI.

## Acceptance Criteria
- Admin can create, edit, and reorder templates.
- Industry tags and show-if conditions are stored and retrievable.
- Survey renders the updated templates for new projects.

## Dependencies
- WP-001 Supabase foundation (migrations + RLS)

## References
- `projects/web-planning/docs/plan.md`
- `projects/web-planning/docs/ui-spec.md`
