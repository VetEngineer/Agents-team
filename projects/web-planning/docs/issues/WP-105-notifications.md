# WP-105 Notifications: email/Slack/Telegram

## Priority
P1

## Summary
Send notifications on submit with clear templates and channel routing.

## Scope
- Define message templates for email, Slack, and Telegram.
- Trigger notifications on project submit.
- Record notification results and failures.

## Acceptance Criteria
- Submit triggers notifications to configured channels.
- Failures are logged with enough detail to retry.
- Templates include project name and snapshot link.

## Dependencies
- WP-004 Project snapshots on submit

## References
- `projects/web-planning/docs/plan.md`
