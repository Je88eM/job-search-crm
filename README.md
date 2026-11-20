# Job Search CRM

A private, Attio-style CRM I built to run my own GTM Engineer job search: target companies, the people I know there, every application in a drag-and-drop pipeline, follow-up tasks, and a Today dashboard that tells me what to do next.

Built from scratch with [Claude Code](https://claude.com/claude-code) as Build #2 for [murdockjesse.com](https://murdockjesse.com).

## Features

- **Today dashboard:** overdue, due-today and upcoming tasks; pipeline counts; and a "Gone quiet" list of applications with no activity for 7+ days.
- **Companies and contacts:** recruiters, hiring managers and referrals linked to their companies, each opening in a side panel.
- **Applications pipeline:** a drag-and-drop Kanban board (Researching → Applied → Interviewing → Offer → Rejected → Closed) plus a table view.
- **Auto follow-up:** moving an application to Applied creates a follow-up task due in 7 days. A Postgres trigger does this, so it fires however the stage changes.
- **Tasks:** linked to a company, contact or application, with instant check-off and filters.
- **Activity log:** emails, calls, LinkedIn messages, interviews and notes, shown on every related record's timeline.
- **Filters in the URL:** filtered views survive a reload and can be linked to.

## Stack

Next.js 16 (App Router, TypeScript) · Supabase (Postgres + Auth) · Tailwind CSS v4 + shadcn/ui · dnd-kit · Vercel

## Security

- **Row Level Security** is on every table: each user can only read and write their own rows. `tools/rls_check.mjs` runs 23 automated break-in attempts (logged out, signing up as a stranger, a second user editing or deleting someone else's data), and all 23 are blocked.
- **Sign-ups are disabled.** It's a single-user app.
- **Only the publishable key is used**, and only on the server. The browser never talks to Supabase directly, and the secret key isn't used anywhere.
- **Security headers:** Content Security Policy, no framing, HSTS.
- **Demo data is fictional** (`supabase/seed.sql`, example.com emails).

## Run it yourself

1. Create a Supabase project and run the files in `supabase/migrations/`, in order, in the SQL Editor.
2. In Supabase Auth, create your user and turn off public sign-ups.
3. Copy `.env.example` to `.env.local` and fill in your project URL and publishable key.
4. Run `npm install`, then `npm run dev`, and open http://localhost:3000.

Optional: create `demo@example.com`, run `supabase/seed.sql` for demo data, add `DEMO_EMAIL`/`DEMO_PASSWORD` to `.env.local`, and run `node tools/rls_check.mjs`.

## How it was built

`build-notes.md` holds the decisions log, the problems I hit and how I fixed them. `CLAUDE.md` and `workflows/` are the instructions Claude Code worked from.
