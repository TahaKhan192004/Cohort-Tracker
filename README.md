# AI Savvy Founders — Cohort Tracker

One hub for a 3-week cohort: the admin assigns tasks, uploads resources, and
tracks progress; participants see their work, submit it, and ask questions.

Next.js 16 (App Router) · Supabase (Postgres + Auth + Storage) · Tailwind v4.

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Create the Supabase project

In the Supabase dashboard, open **SQL Editor** and run
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). That
creates every table, all RLS policies, the `is_admin()` / `admin_ids()` helper
functions, and the private `submissions` storage bucket.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill it from **Project Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The service role key bypasses RLS. It is only read in
[`lib/supabase/admin.ts`](lib/supabase/admin.ts), which is marked `server-only`,
and is used for exactly two things: creating participant accounts and resolving
a username to an email at login. Never prefix it with `NEXT_PUBLIC_`.

### 4. Create the first admin

There is no self-registration, so the first admin is made by hand:

1. **Authentication → Users → Add user**. Enter an email and password, and tick
   *Auto Confirm User*.
2. Copy the new user's UUID, then run this in the SQL editor:

```sql


Every participant after that is created from **Admin → Participants → Add
participant**, which generates a  password and shows it once.

### 5. Run it

```bash
npm run dev
```

Sign in at `/login` with the admin username and password. Create a cohort first
(**Admin → Cohorts**) — tasks, resources, and participants all attach to the
active cohort.

---

## How it fits together

```
app/
  (app)/              Signed-in shell: sidebar, navbar, notification bell
    dashboard/        Participant home — progress ring, today's focus
    tasks/            Task list grouped by week, plus task detail
    resources/        Library, tabbed by type and grouped by category
    profile/          Business snapshot and password change
    admin/            Role-guarded in admin/layout.tsx
  actions/            Server actions, grouped by area
  login/, onboarding/ Unauthenticated and first-login flows
components/           ui/ primitives, plus layout/, tasks/, admin/, resources/
lib/                  Supabase clients, auth helpers, queries, types, utils
proxy.ts              Session refresh and the signed-out redirect
supabase/migrations/  Schema, RLS, storage policies
```

### Decisions worth knowing

**Overdue is derived, never stored.** `task_assignments.status` only ever holds
`pending`, `in_progress`, or `completed`. Anything past its deadline and not
complete is shown as overdue by `displayStatus()` in
[`lib/utils.ts`](lib/utils.ts). No cron job, no nightly drift.

**Login is by username, auth is by email.** Supabase Auth is email/password, so
`signIn` resolves the username to an email with the service-role client before
handing the password to Supabase to verify. A miss falls through with the raw
input so a wrong username and a wrong password produce the same error.

**Comment threads are private per participant.** Comments hang off
`assignment_id`, and the RLS policy only lets you read a comment whose
assignment is yours. Participants cannot see each other's threads; the admin
sees all of them.

**Two helper functions are `security definer`.** `is_admin()` reads
`public.users` from inside a policy on `public.users` — without `security
definer` that recurses forever. `admin_ids()` exists because RLS hides admin
rows from participants, who still need somewhere to address a notification.

**Assignments are created on write, not read.** Creating a task (single or bulk)
fans out a `task_assignment` per cohort member, and creating a participant fans
out an assignment per existing task — so someone joining in week 2 still gets
the full backlog.

**Uploads are scoped by path.** Submission files go to
`submissions/<user-id>/<task-id>/<file>`, and the storage policy checks that the
first path segment matches `auth.uid()`. Admins read any of them through a
10-minute signed URL.

---

## Brand system

Tokens live in [`app/globals.css`](app/globals.css) and are exposed to Tailwind
through `@theme inline` (Tailwind v4 has no `tailwind.config.ts`).

| Token | Value | Use |
| --- | --- | --- |
| `--umber` | `#271512` | Headings, dark surfaces |
| `--cream` | `#FFF9F1` | Page background |
| `--terracotta` | `#7A1F2B` | CTAs, badges, numerals, eyebrows only |
| `--espresso` | `#3A211D` | Body text |
| `--warm-smoke` | `#6D5851` | Secondary text |
| `--ring` | `#CA8E79` | Focus rings, active states |
| `--sand` | `#E8DBD1` | Borders |
| `--muted` | `#F3E9DF` | Hover and subtle fills |

Newsreader for headings (upright noun + italic verb via `.italic-verb`), Manrope
300 for body. No cool greys anywhere; terracotta never becomes body text or a
full-bleed fill. The one sanctioned addition is a warm green (`#5C7A52`) for the
completed/on-track signal, since the palette had no success colour.

---

## Deploying

Push to a Git repo, import it in Vercel, and set the same three environment
variables. Everything renders per-request, so no build-time Supabase access is
needed.

## Not built (per the plan's out-of-scope list)

Email notifications, realtime updates, participant-to-participant chat,
gamification, a mobile app, payments, calendar sync.
