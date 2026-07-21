-- ═══════════════════════════════════════════════════════════════
-- AI Savvy Founders — Cohort Tracker: schema, RLS, storage
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- ═══════════════════════════════════════════════════════════════

-- ── Tables ─────────────────────────────────────────────────────

create table if not exists public.users (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text unique not null,
  full_name      text not null,
  username       text unique not null,
  role           text not null default 'participant' check (role in ('admin', 'participant')),
  onboarded_at   timestamptz,
  last_active_at timestamptz,
  created_at     timestamptz default now()
);

create table if not exists public.cohorts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  start_date date not null,
  end_date   date not null,
  is_active  boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.cohort_members (
  id        uuid primary key default gen_random_uuid(),
  cohort_id uuid references public.cohorts(id) on delete cascade,
  user_id   uuid references public.users(id) on delete cascade,
  joined_at timestamptz default now(),
  unique (cohort_id, user_id)
);

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  cohort_id   uuid references public.cohorts(id) on delete cascade,
  title       text not null,
  description text,
  week_number int,
  day_number  int,
  deadline    timestamptz not null,
  task_type   text default 'action' check (task_type in ('action', 'submission', 'watch', 'skill_build')),
  skill_name  text,
  sort_order  int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists public.task_assignments (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid references public.tasks(id) on delete cascade,
  user_id      uuid references public.users(id) on delete cascade,
  -- Overdue is derived from tasks.deadline at read time (plan: Option B),
  -- so it is deliberately not a stored status value.
  status       text default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at   timestamptz default now(),
  unique (task_id, user_id)
);

create table if not exists public.task_comments (
  id             uuid primary key default gen_random_uuid(),
  task_id        uuid references public.tasks(id) on delete cascade,
  user_id        uuid references public.users(id) on delete cascade,
  assignment_id  uuid references public.task_assignments(id) on delete cascade,
  body           text not null,
  is_admin_reply boolean default false,
  is_read        boolean default false,
  created_at     timestamptz default now()
);

create table if not exists public.submissions (
  id              uuid primary key default gen_random_uuid(),
  task_id         uuid references public.tasks(id) on delete cascade,
  user_id         uuid references public.users(id) on delete cascade,
  submission_text text,
  file_url        text,
  link_url        text,
  status          text default 'submitted' check (status in ('submitted', 'reviewed', 'needs_revision')),
  admin_feedback  text,
  submitted_at    timestamptz default now(),
  reviewed_at     timestamptz,
  unique (task_id, user_id)
);

create table if not exists public.resources (
  id            uuid primary key default gen_random_uuid(),
  cohort_id     uuid references public.cohorts(id) on delete cascade,
  title         text not null,
  description   text,
  resource_type text not null check (resource_type in ('sop', 'video_tutorial', 'skill', 'recording', 'document')),
  content_url   text,
  thumbnail_url text,
  sort_order    int default 0,
  category      text,
  created_at    timestamptz default now()
);

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.users(id) on delete cascade,
  type         text not null check (type in ('new_comment', 'submission_received', 'task_overdue', 'feedback_given')),
  title        text not null,
  body         text,
  link         text,
  is_read      boolean default false,
  created_at   timestamptz default now()
);

-- ── Indexes ────────────────────────────────────────────────────

create index if not exists idx_tasks_cohort            on public.tasks (cohort_id, week_number, day_number, sort_order);
create index if not exists idx_assignments_user        on public.task_assignments (user_id, status);
create index if not exists idx_assignments_task        on public.task_assignments (task_id);
create index if not exists idx_comments_assignment     on public.task_comments (assignment_id, created_at);
create index if not exists idx_submissions_status      on public.submissions (status, submitted_at desc);
create index if not exists idx_notifications_recipient on public.notifications (recipient_id, is_read, created_at desc);
create index if not exists idx_cohort_members_user     on public.cohort_members (user_id);
create index if not exists idx_resources_cohort        on public.resources (cohort_id, sort_order);

-- ── Admin check helper ─────────────────────────────────────────
-- SECURITY DEFINER so the policy body can read public.users without
-- re-triggering the users RLS policy (which would recurse infinitely).

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Participants cannot read admin rows under the users RLS policy, but they
-- still need somewhere to address a notification. This exposes admin ids only.
create or replace function public.admin_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from public.users where role = 'admin';
$$;

grant execute on function public.admin_ids() to authenticated;
grant execute on function public.is_admin() to authenticated;

-- ── RLS ────────────────────────────────────────────────────────

alter table public.users            enable row level security;
alter table public.cohorts          enable row level security;
alter table public.cohort_members   enable row level security;
alter table public.tasks            enable row level security;
alter table public.task_assignments enable row level security;
alter table public.task_comments    enable row level security;
alter table public.submissions      enable row level security;
alter table public.resources        enable row level security;
alter table public.notifications    enable row level security;

-- users: read own row; admin reads and writes all; participants update own profile
drop policy if exists users_select on public.users;
create policy users_select on public.users
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists users_admin_all on public.users;
create policy users_admin_all on public.users
  for all using (public.is_admin()) with check (public.is_admin());

-- cohorts: everyone signed in reads; admin writes
drop policy if exists cohorts_select on public.cohorts;
create policy cohorts_select on public.cohorts
  for select using (auth.uid() is not null);

drop policy if exists cohorts_admin_all on public.cohorts;
create policy cohorts_admin_all on public.cohorts
  for all using (public.is_admin()) with check (public.is_admin());

-- cohort_members: read own membership; admin all
drop policy if exists members_select on public.cohort_members;
create policy members_select on public.cohort_members
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists members_admin_all on public.cohort_members;
create policy members_admin_all on public.cohort_members
  for all using (public.is_admin()) with check (public.is_admin());

-- tasks: participants read tasks for cohorts they belong to; admin all
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.cohort_members m
      where m.cohort_id = tasks.cohort_id and m.user_id = auth.uid()
    )
  );

drop policy if exists tasks_admin_all on public.tasks;
create policy tasks_admin_all on public.tasks
  for all using (public.is_admin()) with check (public.is_admin());

-- task_assignments: own only; admin all
drop policy if exists assignments_select on public.task_assignments;
create policy assignments_select on public.task_assignments
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists assignments_update_own on public.task_assignments;
create policy assignments_update_own on public.task_assignments
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists assignments_admin_all on public.task_assignments;
create policy assignments_admin_all on public.task_assignments
  for all using (public.is_admin()) with check (public.is_admin());

-- task_comments: a participant sees only their own thread (by assignment_id)
drop policy if exists comments_select on public.task_comments;
create policy comments_select on public.task_comments
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.task_assignments a
      where a.id = task_comments.assignment_id and a.user_id = auth.uid()
    )
  );

drop policy if exists comments_insert on public.task_comments;
create policy comments_insert on public.task_comments
  for insert with check (
    public.is_admin()
    or (
      user_id = auth.uid()
      and exists (
        select 1 from public.task_assignments a
        where a.id = task_comments.assignment_id and a.user_id = auth.uid()
      )
    )
  );

drop policy if exists comments_admin_all on public.task_comments;
create policy comments_admin_all on public.task_comments
  for all using (public.is_admin()) with check (public.is_admin());

-- submissions: own only; admin all
drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists submissions_insert_own on public.submissions;
create policy submissions_insert_own on public.submissions
  for insert with check (user_id = auth.uid());

drop policy if exists submissions_update_own on public.submissions;
create policy submissions_update_own on public.submissions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists submissions_admin_all on public.submissions;
create policy submissions_admin_all on public.submissions
  for all using (public.is_admin()) with check (public.is_admin());

-- resources: participants read their cohort's resources; admin all
drop policy if exists resources_select on public.resources;
create policy resources_select on public.resources
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.cohort_members m
      where m.cohort_id = resources.cohort_id and m.user_id = auth.uid()
    )
  );

drop policy if exists resources_admin_all on public.resources;
create policy resources_admin_all on public.resources
  for all using (public.is_admin()) with check (public.is_admin());

-- notifications: scoped to recipient
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select using (recipient_id = auth.uid() or public.is_admin());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (recipient_id = auth.uid() or public.is_admin())
  with check (recipient_id = auth.uid() or public.is_admin());

-- Any signed-in user may create a notification aimed at someone else
-- (participant comment -> admin, admin reply -> participant).
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications
  for insert with check (auth.uid() is not null);

-- ── Storage: submissions bucket ────────────────────────────────
-- Participants read/write only inside a folder named for their uid.

insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', false)
on conflict (id) do nothing;

drop policy if exists submissions_upload_own on storage.objects;
create policy submissions_upload_own on storage.objects
  for insert with check (
    bucket_id = 'submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists submissions_read_own on storage.objects;
create policy submissions_read_own on storage.objects
  for select using (
    bucket_id = 'submissions'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

drop policy if exists submissions_delete_own on storage.objects;
create policy submissions_delete_own on storage.objects
  for delete using (
    bucket_id = 'submissions'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
