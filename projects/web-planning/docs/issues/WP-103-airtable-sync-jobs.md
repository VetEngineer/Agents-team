# WP-103 Airtable sync jobs + logs

## Priority
P1

## Summary
Send submitted snapshots to Airtable with job tracking and logs.

## Scope
- Create sync job records tied to submitted snapshots.
- Implement Airtable payload mapping from snapshot JSON.
- Record sync logs and status transitions.

## Acceptance Criteria
- A sync job is created when a project is submitted.
- Airtable receives a structured payload.
- Failures are logged in `sync_logs` with error details.

## Dependencies
- WP-004 Project snapshots on submit

## References
- `projects/web-planning/docs/data-model.md`
- `projects/web-planning/docs/plan.md`
