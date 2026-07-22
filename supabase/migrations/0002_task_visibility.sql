-- ═══════════════════════════════════════════════════════════════
-- Task visibility — admins draft tasks and release them later.
-- Run in the Supabase SQL editor (or `supabase db push`).
-- ═══════════════════════════════════════════════════════════════

-- Defaults to true so every existing task stays visible after the migration.
alter table public.tasks
  add column if not exists is_published boolean not null default true;

create index if not exists idx_tasks_published
  on public.tasks (cohort_id, is_published);

-- Visibility is enforced in RLS, not just in the queries, so an unpublished
-- task is unreachable even by a hand-rolled request. Admins still see all.
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select using (
    public.is_admin()
    or (
      is_published
      and exists (
        select 1 from public.cohort_members m
        where m.cohort_id = tasks.cohort_id and m.user_id = auth.uid()
      )
    )
  );
