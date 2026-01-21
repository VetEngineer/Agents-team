create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  role text check (role in ('owner','agency','admin')) default 'owner',
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.users(id),
  status text check (status in ('draft','submitted','in_review','done')) default 'draft',
  industry text,
  brand_name_ko text,
  brand_name_en text,
  contact_name text,
  contact_email text,
  contact_phone text,
  existing_site_url text,
  desired_launch_date date,
  constraints_text text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.question_templates (
  id uuid primary key default gen_random_uuid(),
  section text,
  title text,
  description text,
  input_type text check (input_type in (
    'text','textarea','single_select','multi_select','number',
    'url','date','file','cta','menu_list','page_builder'
  )),
  options jsonb,
  required boolean default false,
  order_no int default 0,
  industry_tags text[],
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.project_answers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  question_id uuid references public.question_templates(id),
  value jsonb,
  created_at timestamptz default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  title text,
  purpose text,
  priority int,
  order_no int default 0
);

create table if not exists public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references public.pages(id) on delete cascade,
  section_type text,
  title text,
  body text,
  highlights text,
  cta_text text,
  cta_link_type text,
  cta_link_value text,
  media_required boolean default false,
  order_no int default 0
);

create table if not exists public.styles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  mood_keywords text[],
  avoid_keywords text[],
  brand_colors text[],
  font_pref text,
  photo_style text,
  illustration_use boolean
);

create table if not exists public.functions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  required_features text[],
  responsive_notes text,
  mobile_priority boolean,
  multilingual boolean,
  운영_계획 text
);

create table if not exists public.references (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  url text,
  reason text,
  avoid boolean default false
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  asset_type text,
  file_name text,
  file_url text,
  file_ext text,
  width int,
  height int,
  size_bytes bigint,
  required boolean default true,
  spec_check_pass boolean default false,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.asset_requirements (
  id uuid primary key default gen_random_uuid(),
  asset_type text unique,
  title text,
  required boolean default true,
  description text,
  min_width int,
  min_height int,
  formats text[],
  notes text
);

create or replace function public.is_admin()
returns boolean language sql stable as $$
  select exists(
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_agency()
returns boolean language sql stable as $$
  select exists(
    select 1 from public.users where id = auth.uid() and role = 'agency'
  );
$$;

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.question_templates enable row level security;
alter table public.project_answers enable row level security;
alter table public.pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.styles enable row level security;
alter table public.functions enable row level security;
alter table public.references enable row level security;
alter table public.assets enable row level security;
alter table public.asset_requirements enable row level security;

create policy "users self select" on public.users
  for select using (id = auth.uid() or public.is_admin());

create policy "users self insert" on public.users
  for insert with check (id = auth.uid());

create policy "users admin update" on public.users
  for update using (id = auth.uid() or public.is_admin());

create policy "projects select" on public.projects
  for select using (owner_id = auth.uid() or public.is_admin() or public.is_agency());

create policy "projects insert" on public.projects
  for insert with check (owner_id = auth.uid());

create policy "projects update" on public.projects
  for update using (owner_id = auth.uid() or public.is_admin());

create policy "question_templates select" on public.question_templates
  for select using (true);

create policy "question_templates write admin" on public.question_templates
  for all using (public.is_admin()) with check (public.is_admin());

create policy "project_answers select" on public.project_answers
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin() or public.is_agency())
    )
  );

create policy "project_answers write" on public.project_answers
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "pages select" on public.pages
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin() or public.is_agency())
    )
  );

create policy "pages write" on public.pages
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "page_sections select" on public.page_sections
  for select using (
    exists (
      select 1 from public.pages pg
      join public.projects p on p.id = pg.project_id
      where pg.id = page_id
        and (p.owner_id = auth.uid() or public.is_admin() or public.is_agency())
    )
  );

create policy "page_sections write" on public.page_sections
  for insert with check (
    exists (
      select 1 from public.pages pg
      join public.projects p on p.id = pg.project_id
      where pg.id = page_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "styles select" on public.styles
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin() or public.is_agency())
    )
  );

create policy "styles write" on public.styles
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "functions select" on public.functions
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin() or public.is_agency())
    )
  );

create policy "functions write" on public.functions
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "references select" on public.references
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin() or public.is_agency())
    )
  );

create policy "references write" on public.references
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "assets select" on public.assets
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin() or public.is_agency())
    )
  );

create policy "assets write" on public.assets
  for insert with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "asset_requirements select" on public.asset_requirements
  for select using (true);

create policy "asset_requirements write admin" on public.asset_requirements
  for all using (public.is_admin()) with check (public.is_admin());
