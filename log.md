# Keyword Generator Notes

## Current status

- Local web app runs at `http://127.0.0.1:8000`.
- Flow: upload CSVs -> generate -> preview 100 -> download ZIP.
- Pattern selection supports checkboxes + custom text list.
- POI filtering supports filter sets: `default`, `medical`, `legal`, `accounting`.
- Optional extra terms CSV can be uploaded to extend service terms.

## File locations

- Web app: `keyword-generator/web_app.py`
- Core logic: `keyword-generator/main.py`
- UI: `keyword-generator/templates/index.html`
- Config: `keyword-generator/config.yaml`
- Env: `keyword-generator/.env`

## Common failures and fixes

- Maps Geocoding base URL must be `https://maps.apigw.ntruss.com`.
- Geocoding uses GET with headers:
  - `X-NCP-APIGW-API-KEY-ID`
  - `X-NCP-APIGW-API-KEY`
- `210 Permission Denied` means subscription/key mismatch (not request format).
- `Authentication information are missing` means env vars not loaded.
- `.env` should use `KEY=VALUE` with no quotes.

## Behavior notes

- If keywords are insufficient, app shows warning and still generates available amount.
- ZIP download only happens via explicit download button.

