# AI Savvy Founders — Cohort Tracker

## What This Is

A full-stack web app that replaces scattered tools (Asana, Slack, Google Drive, email) with one cohort hub. Admin (Umaima) manages participants, assigns daily tasks, uploads resources, and tracks progress. Participants log in, see their tasks, submit work, ask questions, and access all recordings and tutorials in one place.

---

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database + Auth:** Supabase (PostgreSQL, Row Level Security, Auth)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel
- **File Storage:** Supabase Storage (for submission uploads, video thumbnails)
- **Video Hosting:** External embed (Loom, YouTube unlisted, or Vimeo links — not self-hosted)

---

## Brand System (AI Savvy Founders)

All UI must follow the AI Savvy Founders design system. No cool greys. No pastel coaching aesthetics.

### Colors
- `--umber`: #271512 (dark backgrounds, text)
- `--cream`: #FFF9F1 (page backgrounds)
- `--terracotta`: #7A1F2B (CTAs and interactive accents ONLY — never body text, never full-bleed fills)
- `--espresso`: #3A211D (primary text, semantic --primary)
- `--warm-smoke`: #6D5851 (secondary text)
- `--ring`: #CA8E79 (highlights, active states)
- `--sand`: #E8DBD1 (borders, dividers)
- `--muted`: #F3E9DF (subtle backgrounds, hover states)

### Typography
- **Display/Headings:** Newsreader (Google Fonts) — signature move: upright noun + italic verb where appropriate
- **Body:** Manrope weight 300 (Light) — never bold
- **Fallbacks:** Georgia, Arial

### Design Rules
- No cool greys anywhere
- Terracotta restricted to buttons, badges, numerals, and eyebrow labels on cream backgrounds
- Rounded corners: subtle (6-8px), not pill-shaped
- Spacing: generous, breathable — this audience is overwhelmed, the UI should feel calm

---

## Database Schema (Supabase)

### `users`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
email           text UNIQUE NOT NULL
full_name       text NOT NULL
username        text UNIQUE NOT NULL
role            text NOT NULL DEFAULT 'participant' CHECK (role IN ('admin', 'participant'))
avatar_url      text
business_name   text
business_type   text
tools_used      text[]  -- e.g. ['GHL', 'Fathom', 'Asana']
biggest_bottleneck text
created_at      timestamptz DEFAULT now()
```

### `cohorts`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
name            text NOT NULL  -- e.g. 'Beta Cohort - July 2026'
start_date      date NOT NULL
end_date        date NOT NULL
is_active       boolean DEFAULT true
created_at      timestamptz DEFAULT now()
```

### `cohort_members`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
cohort_id       uuid REFERENCES cohorts(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
joined_at       timestamptz DEFAULT now()
UNIQUE(cohort_id, user_id)
```

### `tasks`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
cohort_id       uuid REFERENCES cohorts(id) ON DELETE CASCADE
title           text NOT NULL
description     text
week_number     int  -- 1, 2, or 3
day_number      int  -- 1 through 21
deadline        timestamptz NOT NULL
task_type       text DEFAULT 'action' CHECK (task_type IN ('action', 'submission', 'watch', 'skill_build'))
skill_name      text  -- nullable, links task to a specific skill if relevant
sort_order      int DEFAULT 0
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### `task_assignments`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
task_id         uuid REFERENCES tasks(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
status          text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue'))
completed_at    timestamptz
created_at      timestamptz DEFAULT now()
UNIQUE(task_id, user_id)
```

### `task_comments`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
task_id         uuid REFERENCES tasks(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
assignment_id   uuid REFERENCES task_assignments(id) ON DELETE CASCADE
body            text NOT NULL
is_admin_reply  boolean DEFAULT false
is_read         boolean DEFAULT false  -- for admin notification tracking
created_at      timestamptz DEFAULT now()
```

### `submissions`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
task_id         uuid REFERENCES tasks(id) ON DELETE CASCADE
user_id         uuid REFERENCES users(id) ON DELETE CASCADE
submission_text text
file_url        text        -- Supabase Storage path
link_url        text        -- external URL (e.g. link to their Claude project)
status          text DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'needs_revision'))
admin_feedback  text
submitted_at    timestamptz DEFAULT now()
reviewed_at     timestamptz
```

### `resources`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
cohort_id       uuid REFERENCES cohorts(id) ON DELETE CASCADE
title           text NOT NULL
description     text
resource_type   text NOT NULL CHECK (resource_type IN ('sop', 'video_tutorial', 'skill', 'recording', 'document'))
content_url     text  -- embed URL for videos, download URL for docs
thumbnail_url   text
sort_order      int DEFAULT 0
category        text  -- e.g. 'Week 1', 'Skills', 'Live Calls'
created_at      timestamptz DEFAULT now()
```

### `notifications`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
recipient_id    uuid REFERENCES users(id) ON DELETE CASCADE
type            text NOT NULL  -- 'new_comment', 'submission_received', 'task_overdue', 'feedback_given'
title           text NOT NULL
body            text
link            text  -- internal route to navigate to
is_read         boolean DEFAULT false
created_at      timestamptz DEFAULT now()
```

---

## Row Level Security (RLS) Policies

Every table gets RLS enabled. Core logic:

- **Admin** can read and write everything
- **Participants** can only read/write their own assignments, comments, and submissions
- **Participants** can read all tasks and resources for their cohort
- **Participants** cannot see other participants' assignments, comments, or submissions
- **Notifications** are scoped to `recipient_id = auth.uid()`

Admin role check: `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')`

---

## Auth Flow

No self-registration. No magic links. No OAuth.

1. Admin goes to Admin Panel > Create User
2. Admin enters: full_name, email, username
3. System generates a secure random password
4. Supabase `auth.admin.createUser()` via server action (uses service role key, server-side only)
5. Credentials saved. Admin copies and sends them manually (Slack, email, whatever)
6. Participant logs in at `/login` with username + password
7. On first login, participant fills a short onboarding form: business_name, business_type, tools_used, biggest_bottleneck — saved to their `users` row

---

## App Structure

### Routes

```
/login                          — Login page
/onboarding                     — First-login business snapshot form

# PARTICIPANT ROUTES
/dashboard                      — My tasks overview, progress bar, upcoming deadlines, notifications
/tasks                          — All my tasks grouped by week, filterable by status
/tasks/[id]                     — Single task view with description, deadline, comments thread, submission form
/resources                      — All resources grouped by category (SOPs, Tutorials, Skills, Recordings)
/resources/[id]                 — Single resource view (video embed or document)
/profile                        — My profile, business info, change password

# ADMIN ROUTES
/admin                          — Admin dashboard: cohort stats, recent activity, unread comments, pending submissions
/admin/users                    — All participants list with progress percentages
/admin/users/create             — Create new participant account
/admin/users/[id]               — Single participant detail: their tasks, submissions, progress
/admin/tasks                    — All tasks for active cohort. Add, edit, delete, bulk add
/admin/tasks/create             — Create single task
/admin/tasks/bulk               — Bulk task creation (paste or upload CSV: title, description, week, day, deadline, type)
/admin/tasks/[id]               — Edit task, view all participant statuses for this task
/admin/submissions              — All submissions across cohort, filterable by status
/admin/submissions/[id]         — Review single submission, leave feedback, mark reviewed/needs_revision
/admin/resources                — Manage resources: add, edit, delete, reorder
/admin/resources/create         — Add new resource (title, type, URL, category)
/admin/notifications            — All unread comment notifications in one feed
/admin/cohorts                  — Manage cohorts (create, archive, switch active)
```

---

## Page Specifications

### Participant Dashboard (`/dashboard`)

Top section:
- Welcome message with participant name
- Overall progress: circular or bar chart showing % tasks completed
- Current week indicator (Week 1 / Week 2 / Week 3)

Middle section:
- "Today's Tasks" — tasks due today or overdue, sorted by deadline
- Each task card shows: title, type badge, deadline, status chip, unread comment indicator
- Clicking a task navigates to `/tasks/[id]`

Bottom section:
- Recent notifications (last 5)
- Quick links to resources

### Task Detail (`/tasks/[id]`)

Layout:
- Task title, description (supports markdown rendering)
- Deadline with visual urgency (green = on track, amber = due soon, terracotta = overdue)
- Status toggle: participant can mark "In Progress" or "Completed"
- If task_type is 'submission': submission form appears below (text field + file upload + URL field)
- Comments thread at bottom: participant posts questions, admin replies appear below. Threaded by assignment_id so each participant's thread is private between them and admin.

### Admin Dashboard (`/admin`)

Cards across top:
- Total participants
- Tasks completed (aggregate %)
- Pending submissions
- Unread comments (clicking navigates to notification feed)

Below cards:
- Participant leaderboard table: name, business, tasks completed, tasks overdue, last active
- Recent activity feed: latest submissions, comments, completions

### Admin Task Management (`/admin/tasks`)

Table view of all tasks for active cohort:
- Columns: title, week, day, deadline, type, completion rate (X/Y participants done)
- Inline actions: edit, delete, duplicate
- "Add Task" button at top
- "Bulk Add" button at top — opens a page with:
  - CSV paste area (title, description, week, day, deadline, type — one row per task)
  - Preview table before confirming
  - "Create All" button that inserts tasks and auto-creates task_assignments for all cohort members

### Admin User Management (`/admin/users`)

Table of all participants:
- Columns: name, email, business, progress %, overdue count, last active
- Click row to see individual participant detail
- "Create User" button at top

### Admin User Creation (`/admin/users/create`)

Form fields: full_name, email, username
On submit:
- Generates password (16 chars, alphanumeric + special)
- Creates Supabase auth user via service role
- Inserts into `users` table with role='participant'
- Adds to active cohort via `cohort_members`
- Creates `task_assignments` for all existing tasks in that cohort
- Shows credentials on screen for admin to copy

### Admin Submissions (`/admin/submissions`)

Table view:
- Columns: participant name, task title, submitted date, status
- Filter by: status (submitted / reviewed / needs_revision)
- Click to open review modal: see submission content, leave feedback text, change status

### Admin Resources (`/admin/resources`)

List view with drag-to-reorder:
- Each resource shows: title, type badge, category, edit/delete buttons
- "Add Resource" button
- Resource form: title, description, type (dropdown), content_url, thumbnail_url (optional), category (dropdown or free text)

### Resources Page — Participant (`/resources`)

Tabbed or filtered view:
- Tabs: All, Recordings, Video Tutorials, SOPs, Skills
- Each resource card: thumbnail (or type icon if no thumbnail), title, description preview
- Click to open resource detail with embedded video player (iframe for Loom/YouTube/Vimeo) or download link

---

## Notifications System

Triggers (all create a row in `notifications` table):

1. **Participant posts a comment** → notification to admin (type: 'new_comment')
2. **Participant submits work** → notification to admin (type: 'submission_received')
3. **Admin replies to a comment** → notification to that participant (type: 'feedback_given')
4. **Admin reviews submission** → notification to that participant (type: 'feedback_given')
5. **Task becomes overdue** → notification to participant (type: 'task_overdue') — triggered by a cron job or Supabase edge function that runs daily

Notification bell icon in navbar shows unread count. Clicking opens dropdown with recent notifications. Each notification links to the relevant page.

---

## Bulk Task Operations

### Bulk Add
Admin can create multiple tasks at once via:
1. A multi-row form (add rows dynamically)
2. CSV paste (tab or comma separated)

On bulk create:
- Insert all tasks into `tasks` table
- For each task, create a `task_assignment` for every participant in the active cohort
- Set initial status to 'pending'

### Bulk Delete
Admin can select multiple tasks via checkboxes and delete them. Cascade deletes assignments, comments, and submissions for those tasks.

### When a new participant joins mid-cohort
- On user creation, system creates `task_assignments` for all existing tasks in the cohort with status='pending'
- Past-deadline tasks get status='overdue' automatically

---

## Admin Reporting Dashboard

### Cohort Overview Stats
- Total tasks in cohort
- Average completion rate across all participants
- Number of overdue tasks (aggregate)
- Submissions pending review
- Unread comments

### Per-Participant Stats
- Tasks completed / total
- Tasks overdue
- Submissions submitted / reviewed / needs_revision
- Last login timestamp
- Comments posted

### Per-Task Stats
- How many participants completed it
- How many are overdue on it
- How many submitted (if submission type)
- Average time to completion (completed_at minus task created_at)

### Export
- Admin can export participant progress as CSV (name, email, tasks completed, tasks overdue, submissions count)

---

## Overdue Task Handling

Option A (recommended for MVP): A Supabase Edge Function on a daily cron that:
1. Finds all `task_assignments` where status is 'pending' or 'in_progress' AND the parent task's deadline has passed
2. Updates status to 'overdue'
3. Creates a notification for the participant

Option B (simpler): Calculate overdue status on the fly in queries by comparing `tasks.deadline` to `now()`. No cron needed. Status column only stores 'pending', 'in_progress', 'completed'. UI displays overdue based on deadline comparison.

Go with Option B for MVP. Simpler. No edge function needed.

---

## Implementation Order

### Phase 1: Foundation
1. Initialize Next.js project with App Router
2. Set up Supabase project, configure env vars
3. Create all database tables and RLS policies
4. Set up Supabase Auth with email/password
5. Build login page
6. Build auth middleware (redirect unauthenticated, redirect based on role)
7. Build layout with sidebar navigation (participant vs admin views)

### Phase 2: Admin Core
8. Admin dashboard with placeholder stats
9. Cohort management (create cohort, set active)
10. User creation flow (form, password generation, Supabase auth user creation)
11. Task CRUD (create, read, update, delete single tasks)
12. Bulk task creation (CSV paste + preview + confirm)
13. Auto-assignment logic (on task create, assign to all cohort members)

### Phase 3: Participant Core
14. Participant dashboard (my tasks, progress, deadlines)
15. Task list page (grouped by week, filtered by status)
16. Task detail page (description, status toggle, deadline display)
17. Comments on tasks (participant posts, admin replies)
18. Submission form on submission-type tasks (text + file upload + URL)
19. Onboarding form (first login business snapshot)

### Phase 4: Resources
20. Admin resource management (CRUD, categorize, reorder)
21. Participant resources page (tabbed view, video embeds, downloads)

### Phase 5: Notifications and Reporting
22. Notification system (create on triggers, bell icon, dropdown)
23. Admin reporting dashboard (cohort stats, per-participant, per-task)
24. CSV export for admin

### Phase 6: Polish
25. Responsive design pass (mobile-friendly for participants checking on phone)
26. Loading states, empty states, error handling
27. Password change flow for participants
28. Task overdue visual indicators throughout

---

## File Structure

```
/
├── app/
│   ├── layout.tsx                    — Root layout, font imports, global styles
│   ├── login/
│   │   └── page.tsx
│   ├── onboarding/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx                  — Participant dashboard
│   ├── tasks/
│   │   ├── page.tsx                  — Task list
│   │   └── [id]/
│   │       └── page.tsx              — Task detail + comments + submission
│   ├── resources/
│   │   ├── page.tsx                  — Resource library
│   │   └── [id]/
│   │       └── page.tsx              — Single resource view
│   ├── profile/
│   │   └── page.tsx
│   ├── admin/
│   │   ├── page.tsx                  — Admin dashboard
│   │   ├── users/
│   │   │   ├── page.tsx              — Participant list
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx          — Participant detail
│   │   ├── tasks/
│   │   │   ├── page.tsx              — Task management table
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   ├── bulk/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx          — Edit task + view completion stats
│   │   ├── submissions/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── resources/
│   │   │   ├── page.tsx
│   │   │   └── create/
│   │   │       └── page.tsx
│   │   ├── notifications/
│   │   │   └── page.tsx
│   │   └── cohorts/
│   │       └── page.tsx
│   └── api/
│       └── admin/
│           └── create-user/
│               └── route.ts          — Server action using service role key
├── components/
│   ├── ui/                           — Shared UI primitives (Button, Input, Card, Badge, Modal, Table)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Navbar.tsx
│   │   └── NotificationBell.tsx
│   ├── tasks/
│   │   ├── TaskCard.tsx
│   │   ├── TaskStatusBadge.tsx
│   │   ├── CommentThread.tsx
│   │   └── SubmissionForm.tsx
│   ├── admin/
│   │   ├── StatsCard.tsx
│   │   ├── ParticipantTable.tsx
│   │   ├── BulkTaskUploader.tsx
│   │   └── SubmissionReviewModal.tsx
│   └── resources/
│       ├── ResourceCard.tsx
│       └── VideoEmbed.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 — Browser client
│   │   ├── server.ts                 — Server client (for server components/actions)
│   │   └── admin.ts                  — Service role client (for user creation only)
│   ├── utils.ts                      — Date formatting, password generation, etc.
│   └── types.ts                      — TypeScript types matching DB schema
├── middleware.ts                      — Auth check, role-based redirects
└── tailwind.config.ts                — Brand tokens mapped to Tailwind
```

---

## Key Technical Decisions

1. **No ORM.** Use Supabase JS client directly. Keeps it simple, matches RLS model.
2. **Server Components by default.** Client components only where interactivity is needed (forms, toggles, modals).
3. **Server Actions for mutations.** Create task, update status, post comment, submit work — all via Next.js server actions calling Supabase.
4. **Service Role key stays server-side only.** The `/api/admin/create-user` route uses the service role key to call `supabase.auth.admin.createUser()`. This key never touches the browser.
5. **File uploads via Supabase Storage.** Submissions bucket with RLS: participants can upload to their own folder, admin can read all.
6. **Video content is embedded, not hosted.** Resources store a URL. The UI renders an iframe for Loom/YouTube/Vimeo links. No video processing needed.
7. **Realtime optional for MVP.** Notifications load on page load and refresh. Supabase Realtime can be added later for live notification badges if needed.

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-side only, never exposed to client
```

---

## Out of Scope for MVP

- Email notifications (all notifications are in-app only for now)
- Realtime/websocket updates
- Participant-to-participant chat or community features
- Gamification or points system
- Mobile app (responsive web is sufficient)
- Payment integration
- Calendar sync
