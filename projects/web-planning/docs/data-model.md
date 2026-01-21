# Data Model Draft (MVP)

## Goals
- Keep input flexible during MVP while enabling clean export to Airtable/Notion.
- Preserve a stable, versioned snapshot for sync jobs.
- Avoid breaking changes when question templates evolve.

## Current Tables (from `apps/planner/supabase/migrations/0001_init.sql`)
- users, projects
- question_templates, project_answers
- pages, page_sections
- styles, functions
- references, assets, asset_requirements

## MVP Snapshot Payload (JSON)
Store a point-in-time snapshot used for export. Keep raw answers separate.

```json
{
  "project_id": "uuid",
  "status": "draft|submitted|in_review|done",
  "owner": {
    "name": "string",
    "email": "string",
    "phone": "string"
  },
  "basic": {
    "industry": "string",
    "brand_name_ko": "string",
    "brand_name_en": "string",
    "existing_site_url": "string",
    "desired_launch_date": "YYYY-MM-DD",
    "constraints_text": "string"
  },
  "sitemap": [
    {
      "id": "page_id",
      "title": "string",
      "purpose": "string",
      "priority": 1,
      "order_no": 0,
      "sections": [
        {
          "id": "section_id",
          "section_type": "string",
          "title": "string",
          "body": "string",
          "highlights": "string",
          "cta": {
            "text": "string",
            "link_type": "phone|kakao|reservation|inquiry|map|custom",
            "link_value": "string"
          },
          "media_required": true,
          "order_no": 0
        }
      ]
    }
  ],
  "functions": {
    "required_features": ["string"],
    "responsive_notes": "string",
    "mobile_priority": true,
    "multilingual": false,
    "ops_plan": "string"
  },
  "style": {
    "mood_keywords": ["string"],
    "avoid_keywords": ["string"],
    "brand_colors": ["#RRGGBB"],
    "font_pref": "string",
    "photo_style": "string",
    "illustration_use": true
  },
  "references": [
    { "url": "string", "reason": "string", "avoid": false }
  ],
  "assets": [
    {
      "asset_type": "string",
      "file_name": "string",
      "file_url": "string",
      "file_ext": "string",
      "width": 1200,
      "height": 800,
      "size_bytes": 123456,
      "required": true,
      "spec_check_pass": false,
      "notes": "string"
    }
  ],
  "answers": [
    {
      "question_id": "uuid",
      "value": { "any": "json" }
    }
  ],
  "version": 1,
  "created_at": "ISO-8601"
}
```

## Mapping From Tables
- projects -> basic + status
- users -> owner
- pages + page_sections -> sitemap
- functions -> functions
- styles -> style
- references -> references
- assets -> assets
- project_answers -> answers

## Recommended Additions (MVP-Friendly)
1) `project_snapshots`
   - `id uuid pk`, `project_id uuid fk`, `payload jsonb`, `version int`,
     `created_at timestamptz`, `created_by uuid`
2) `sync_jobs`
   - `id uuid pk`, `project_id uuid fk`, `target text`,
     `status text`, `error text`, `created_at timestamptz`
3) `sync_logs`
   - `id uuid pk`, `sync_job_id uuid fk`, `message text`,
     `created_at timestamptz`

## Notes
- Keep `project_answers` as the raw audit trail.
- Generate `project_snapshots` on submit or on explicit "Export".
- Use `assets.file_url` for external tools (avoid binary uploads).
