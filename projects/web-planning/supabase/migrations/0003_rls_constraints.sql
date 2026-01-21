create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_question_templates_updated_at on public.question_templates;
create trigger set_question_templates_updated_at
before update on public.question_templates
for each row execute function public.set_updated_at();

alter table public.project_answers
  add constraint project_answers_project_question_unique
  unique (project_id, question_id);

alter table public.styles
  add constraint styles_project_unique
  unique (project_id);

alter table public.functions
  add constraint functions_project_unique
  unique (project_id);

create policy "project_answers update" on public.project_answers
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "project_answers delete" on public.project_answers
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "pages update" on public.pages
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "pages delete" on public.pages
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "page_sections update" on public.page_sections
  for update using (
    exists (
      select 1 from public.pages pg
      join public.projects p on p.id = pg.project_id
      where pg.id = page_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "page_sections delete" on public.page_sections
  for delete using (
    exists (
      select 1 from public.pages pg
      join public.projects p on p.id = pg.project_id
      where pg.id = page_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "styles update" on public.styles
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "styles delete" on public.styles
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "functions update" on public.functions
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "functions delete" on public.functions
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "references update" on public.references
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "references delete" on public.references
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "assets update" on public.assets
  for update using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );

create policy "assets delete" on public.assets
  for delete using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and (p.owner_id = auth.uid() or public.is_admin())
    )
  );
