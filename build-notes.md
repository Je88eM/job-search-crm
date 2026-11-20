# Build notes: CRM from scratch

Running notes for the website write-up (Build #2). Rough is fine. Write as you go, and only include things that actually happened.

## The brief

- What Tim asked for: build a CRM with a task management dashboard from scratch with Claude Code, to replace a paid tool (Jira, Notion, Asana and so on)
- Requirements / constraints: follow the planning phase (brief → clarifying questions → approved plan) before any code
- Deadline: none

## The problem

Why build a CRM from scratch? What should it do better or differently?

## Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-11-20 | Use case: a CRM for my own GTM job search (not Tim's course business, not an agency CRM yet) | I use it every day with real data, and a job search is a GTM motion: target accounts, contacts, a pipeline and follow-ups. An agency (Claygency) CRM can be a later build |
| 2026-11-20 | Just me, online, behind a login (sign-ups disabled) | It holds real recruiters' contact details, so it needs a login, and I want it on any device |
| 2026-11-20 | v1: Companies, Contacts, Applications (table + drag-and-drop board), Tasks, Today dashboard, activity log, auto follow-up tasks | These are the features I'd actually use. Clay enrichment and Gmail wait for v2 |
| 2026-11-20 | Look: like Attio, but simpler | A tool I already know, with a clean look for the Loom |
| 2026-11-20 | Stack: Next.js + Supabase + Vercel, Tailwind + shadcn/ui | Same as Tim's video, all on free tiers |
| 2026-11-20 | Keys in `.env.local`, not a `supabase_keys.md` file as in the video; Row Level Security on every table | Security: a loose keys file can be uploaded to GitHub by accident, and RLS is what actually protects the data |
| 2026-11-20 | Public GitHub repo | Hiring managers can read the code. No secrets or data live in the code |
| 2026-11-20 | Auto follow-up runs in the database (a Postgres trigger), not in the app | It always fires, however the application is moved |

## What I built

Features, how they work, and the tools/stack behind them.

- **Login:** email and password through Supabase Auth. Public sign-ups are off, so only I can get in. Every page sends logged-out visitors to the login page, and the database itself refuses anyone who isn't logged in (tested: "permission denied").
- **Companies:** a table of target companies with priority badges and counts of contacts and applications. Clicking a row opens an Attio-style side panel to edit the company, open its website and see who I know there.
- **Contacts:** recruiters, hiring managers and referrals, each linked to a company and color-coded by type. The side panel has email and LinkedIn links, and you can jump between a company and its contacts.
- **Applications pipeline:** every role I'm pursuing, linked to a company and a main contact, with two views:
  - **Board:** drag-and-drop Kanban (Researching → Applied → Interviewing → Offer → Rejected → Closed), built with dnd-kit. Cards move instantly (an optimistic update) and snap back if the save fails. A click opens the card, and only a real drag of 5px or more moves it.
  - **Table:** a sortable list with stage badges, applied dates and salary ranges.
- **Auto follow-up:** moving an application to Applied (by dragging or in the form) makes the database create a "Follow up with {company} about {role}" task due in 7 days, and fill in the applied date if it's empty.
- **Tasks:** a checklist of follow-ups, each linkable to a company, contact and application. Ticking the box saves instantly. Overdue dates show in red, and a sparkle marks tasks the system created. Filters: open, completed or all; overdue, today or this week; by company.
- **Today dashboard (home screen):** counts of active applications, interviews, offers and overdue tasks; overdue, due-today and next-7-days task lists you can tick off right there; pipeline counts per stage; and a "Gone quiet" list of applications with no activity for 7+ days.
- **Activity log:** a timeline in every company, contact and application side panel, with icons for email, call, LinkedIn, interview and note, plus a quick "Log activity" form. Logging something on an application also attaches it to that company and main contact, so I write it once and it shows on all three timelines. Activity on an application resets its "Gone quiet" timer on the dashboard.
- **Filters in the URL:** search and dropdown filters (priority, type, company) are saved in the page address, so a filtered view survives a reload and other tabs can link to it.
- **Safety details:** links are only saved if they start with http(s), so a stored link can't run code. Error messages don't reveal which emails have accounts.
- **Demo account + fake data:** a separate `demo@example.com` login filled by `supabase/seed.sql` with invented companies and people (example.com emails), so screenshots and the Loom never show real recruiters. Dates are relative to today, so the dashboard always looks live, and re-running the script resets it.
- **Automated security test (`tools/rls_check.mjs`):** 23 checks that try to break in: reading every table while logged out, signing up as a stranger, and, logged in as the demo user, reading, editing, deleting or creating rows that belong to my real account. Result: **23/23 blocked**.
- **Security hardening (secure.md checklist):** browser security headers (only my own site's code can run, the app can't be framed by other sites, HTTPS forced); the browser never talks to Supabase directly, every read and save goes through the server; a friendly error page that hides technical details; 0 known vulnerabilities in the code that ships (the 4 moderate npm warnings are in the shadcn build tool, which never reaches the browser).

## Problems I hit (and how I fixed them)

- **Running the database setup in Supabase took three tries.** First I clicked Run on an empty editor ("expected string to have >=1 characters"). Then I pasted the PowerShell command that copies the file instead of the SQL inside it (`syntax error at or near "Get"`). The fix was to open the `.sql` file in Notepad, select all, copy, paste and run. Lesson: read the error, because both times it said exactly what was wrong.
- **The Publishable key didn't work at first ("Invalid API key").** The first paste included extra characters (64 instead of 46), and the URL had `/rest/v1/` on the end. Using Supabase's Copy button and trimming the URL fixed both. Claude checked the key's format without ever printing it.
- **Next.js 16 refused to build the logged-in pages.** In this version, anything that reads the login cookie must sit inside a `<Suspense>` loading boundary. I wrapped the signed-in email and the page content in one, so the sidebar shows instantly and personal data streams in.
- **"Today" depends on where the server is.** Vercel's servers run on UTC, 8 hours ahead of San Francisco, so after about 4pm my time the server would already think it's tomorrow. All date logic (in the app and the database's follow-up rule) is now pinned to Pacific time.
- **Logged activities didn't show on other tabs until a reload.** Next.js keeps copies of pages it has already loaded, so tabs feel instant. After a save, only the current page was refreshed, so the contact's timeline showed an older copy. Every save now clears the cached copies of all pages, because one save can change several tabs: an activity shows on its company, contact and application, and moving a card to Applied creates a task.
- **Supabase's "Grant API access to new tables automatically" was off.** That's the safer setting, but my tables would have been unreachable. I added an explicit `grant … to authenticated` to the migration, so only logged-in users get access and RLS still limits them to their own rows.

## What I learned

-

## Showcase

- Loom walkthrough link:
- Live demo link (if any):
- Screenshots (save in `screenshots/`, using test data only):
- Tools used:
