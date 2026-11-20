# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Agent Instructions

You operate inside the **WAT framework** — Workflows, Agents, Tools. This separation keeps the system reliable: AI handles reasoning and coordination, while deterministic code handles execution.

---

## The Three Layers

**Workflows — the instructions**
Markdown SOPs stored in `workflows/`. Each one defines an objective, required inputs, which tools to use, expected outputs, and how to handle edge cases. Written in plain language, the same way you'd brief a capable team member.

**Agents — the decision-maker (you)**
Your responsibility is intelligent coordination. Read the relevant workflow, run tools in the right sequence, recover from failures gracefully, and ask clarifying questions when something is unclear. You connect intent to execution — you don't try to do everything yourself.
- Example: If you need to pull data from a website, don't attempt it directly. Read `workflows/scrape_website.md`, identify the required inputs, then run `tools/scrape_single_site.py`.

**Tools — the execution layer**
Python scripts in `tools/` that do the actual work: API calls, data transformations, file operations, database queries. Credentials and API keys live in `.env`. These scripts are consistent, testable, and fast.

**Why this structure works:** When AI handles every step directly, accuracy compounds downward fast. Five steps at 90% accuracy each leaves you at 59% overall success. Offloading execution to deterministic scripts keeps you focused on orchestration and decision-making — where you perform best.

---

## How to Operate

**1. Check for existing tools first**
Before writing anything new, scan `tools/` for what your workflow needs. Only build new scripts when nothing exists for the task.

**2. Learn from failures, don't just recover from them**
When something breaks:
- Read the full error message and trace
- Fix the script and retest (if it uses paid API calls or credits, check with me before rerunning)
- Update the workflow with what you learned — rate limits, timing quirks, unexpected behaviour
- Example: You hit a rate limit, dig into the docs, find a batch endpoint, refactor the tool to use it, verify it works, then update the workflow so it never trips the same way again

**3. Keep workflows current**
When you find a better method, discover a constraint, or hit a recurring issue, update the workflow. That said, never create or overwrite workflows without asking unless explicitly told to. These are your standing instructions — preserve and refine them, don't discard them after a single use.

---

## Starting a New Project

Before doing anything on a new build, read `workflows/planning_phase.md`.

This covers how to set up the project, write the brief, define the architecture, lock in the tech stack, and get to an approved plan before any code is touched. Follow it in sequence.

Only move into execution once the plan has been reviewed and approved.

---

## The Self-Improvement Loop

Every failure is an opportunity to make the system more robust:
1. Identify what broke
2. Fix the tool
3. Verify the fix works
4. Update the workflow with the improved approach
5. Continue with a stronger system

---

## File Structure

**Where things live:**
- **Deliverables** — final outputs go to cloud services (Google Sheets, Slides, etc.) where they're directly accessible
- **Intermediates** — temporary processing files that can be regenerated at any time

**Directory layout:**
```
.tmp/                         # Temporary files — scraped data, intermediate exports. Disposable.
tools/                        # Python scripts for deterministic execution
workflows/                    # Markdown SOPs defining objectives and steps
.env                          # API keys and environment variables — NEVER store secrets anywhere else
credentials.json, token.json  # Google OAuth (gitignored)
```

Local files are for processing only. Anything that needs to be seen or used downstream lives in cloud services. Everything in `.tmp/` is disposable.

---

## The Short Version

You sit between what I want (workflows) and what actually gets done (tools). Read the instructions, make smart decisions, call the right tools, recover from errors, and keep improving the system as you go.

Stay pragmatic. Stay reliable. Keep learning.

---

## This Project: CRM + task management tool

Jesse Murdock's CRM with a task management dashboard, built from scratch with Claude Code as an assignment from mentor Tim Yakubson (Unlock GTME). It will be showcased as Build #2 on murdockjesse.com.

**Use case:** a single-user, Attio-style **job-search CRM** for Jesse's GTM Engineer job hunt: companies, contacts (recruiters, hiring managers, referrals), applications pipeline (table + Kanban), tasks, a Today dashboard, an activity log, and an auto follow-up task 7 days after an application moves to Applied. Plan approved 2026-11-20 (see `build-notes.md` decisions log). No integrations in v1.

**Stack:** Next.js 16 (App Router, TypeScript, `src/`), Tailwind v4 + shadcn/ui, Supabase (Postgres + email/password Auth, sign-ups disabled), `@dnd-kit` for the board, Vercel hosting, public GitHub repo.

**Layout**
```
src/app/                  # Routes. /login is public; everything else requires a session
src/components/ui/        # shadcn/ui components (generated; add more with `npx shadcn@latest add <name>`)
src/lib/supabase/         # server.ts: the only Supabase client (the browser never talks to Supabase directly)
src/proxy.ts              # Next 16's name for middleware: refreshes the session, redirects signed-out users to /login
supabase/migrations/      # Database schema, RLS policies and triggers (source of truth for the DB)
supabase/seed.sql         # Fictional demo data for demo@example.com; re-run in the SQL Editor to reset
tools/rls_check.mjs       # Security test: `node tools/rls_check.mjs` (needs DEMO_EMAIL/DEMO_PASSWORD in .env.local)
.env.example              # Key names only; real values go in .env.local
```

**Commands** (PowerShell: use `npm.cmd` if `npm` is blocked)
- `npm run dev`: local app at http://localhost:3000
- `npm run lint` and `npm run build`: both must pass before any commit or deploy
- Database changes: add a new file in `supabase/migrations/` and run it in the Supabase SQL Editor; never edit an applied migration

**Rules**
- Next.js 16 differs from older versions: check `node_modules/next/dist/docs/` before using an API (see `AGENTS.md`).
- Only the publishable key is used. Never add the secret/service-role key to the app.
- Every new table: `user_id default auth.uid()`, RLS enabled, four owner-only policies.
- Commit/push only when Jesse says so.

**Definition of done (per feature):** works in the local app with test data, lint + build pass, `node tools/rls_check.mjs` passes (RLS still blocks other users), and `build-notes.md` is updated.

**Security rules (from `secure.md`)**
- API keys and passwords go in `.env.local` only, never in other files and never pasted into chat. Supabase's secret/service-role key must never reach the browser or Git.
- If Supabase is used, enable Row Level Security on every table; the publishable/anon key is public by design.
- Use test data, never real people's details, in screenshots, Loom recordings and seed files.
- Approve tool permissions per project, not globally.

**Showcase**
- Keep `build-notes.md` up to date (decisions, problems, lessons, Loom/screenshot links). It becomes the Build #2 write-up on murdockjesse.com, which lives in the separate `GTME - Website` folder (next to this one) project. Never edit the website from this project.
