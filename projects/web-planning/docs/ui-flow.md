# UI Flow Draft (Wizard)

## Goal
Help users finish a usable planning brief with minimal friction and a clear export step.

## Step Flow (MVP)
1) Sign in
2) Project setup
3) Brand + audience basics
4) Sitemap + sections
5) Features + ops
6) Style + references
7) Assets upload
8) Review + submit

## Screen Notes
### 1) Sign in
- Kakao auth entry.
- Allow guest draft with local save; prompt to sign in before submit.

### 2) Project setup
- Project name, industry, desired launch date.
- Helper text on timeline constraints.

### 3) Brand + audience
- Brand name (ko/en), key message, target audience.
- Provide "Not sure" choices to reduce drop-off.

### 4) Sitemap + sections
- Tree or list-based page builder.
- Each page has sections; section types use presets.
- Allow reorder and quick duplicate.

### 5) Features + ops
- Feature presets (login, board, booking, payment).
- Ops plan (who updates content, approval flow).

### 6) Style + references
- Mood keywords and avoid list.
- Reference URLs + reason.

### 7) Assets upload
- Upload cards by asset type with spec check.
- Show pass/fail and missing list.

### 8) Review + submit
- Summary view with warnings for missing items.
- Submit creates snapshot + triggers export.

## Required UX Components
- Progress indicator + autosave state.
- Primary CTA pinned to the bottom on mobile.
- Inline warnings for missing required items.

## Minimal Review Summary Blocks
- Basic info
- Sitemap outline
- Features
- Style + references
- Assets checklist
