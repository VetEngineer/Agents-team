alter table public.projects
  add column if not exists project_name text,
  add column if not exists key_message text,
  add column if not exists target_audience text;
