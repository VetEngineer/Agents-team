# WP-104 Notion/Sheets export stub

## Priority
P1

## Summary
Add a stub export interface for Notion and Google Sheets to keep the API stable.

## Scope
- Define export targets for Notion and Sheets.
- Create placeholder handlers that record sync jobs without sending data.
- Document required fields for future integrations.

## Acceptance Criteria
- Sync jobs can be created with target `notion` or `sheets`.
- Jobs are marked as `queued` with clear "not implemented" logs.
- API surface remains stable for future work.

## Dependencies
- WP-004 Project snapshots on submit

## References
- `projects/web-planning/docs/plan.md`
