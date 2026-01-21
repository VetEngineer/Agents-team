create table if not exists public.project_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  payload jsonb not null,
  version int default 1,
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

create table if not exists public.sync_jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  snapshot_id uuid references public.project_snapshots(id) on delete set null,
  target text,
  status text check (status in ('queued','running','success','failed')) default 'queued',
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.sync_logs (
  id uuid primary key default gen_random_uuid(),
  sync_job_id uuid references public.sync_jobs(id) on delete cascade,
  message text,
  created_at timestamptz default now()
);

alter table public.project_snapshots enable row level security;
alter table public.sync_jobs enable row level security;
alter table public.sync_logs enable row level security;

create policy "project_snapshots select" on public.project_snapshots
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin() or public.is_agency())
    )
  );

create policy "project_snapshots write" on public.project_snapshots
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "sync_jobs select" on public.sync_jobs
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin() or public.is_agency())
    )
  );

create policy "sync_jobs write" on public.sync_jobs
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "sync_logs select" on public.sync_logs
  for select using (
    exists (
      select 1 from public.sync_jobs sj
      join public.projects p on p.id = sj.project_id
      where sj.id = sync_job_id
        and (p.owner_id = auth.uid() or public.is_admin() or public.is_agency())
    )
  );

create policy "sync_logs write" on public.sync_logs
  for insert with check (
    exists (
      select 1 from public.sync_jobs sj
      join public.projects p on p.id = sj.project_id
      where sj.id = sync_job_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );
