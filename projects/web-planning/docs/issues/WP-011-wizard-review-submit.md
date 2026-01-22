# WP-011 Wizard step: review + submit

## Priority
P0

## Summary
Build the review page that summarizes the brief and submits it.

## Scope
- Summary blocks for core sections.
- Missing-required warnings.
- Submit action triggers snapshot creation and status change.

## Acceptance Criteria
- Summary renders all required blocks.
- Missing items are highlighted before submit.
- Submit creates a snapshot and changes status.

## Dependencies
- WP-004 Project snapshots on submit
- WP-005 Core CRUD APIs + autosave

## References
- `projects/web-planning/docs/ui-flow.md`
- `projects/web-planning/docs/ui-spec.md`
