-- Job-search CRM: initial schema
-- Every table is owned by one user (user_id) and protected by Row Level Security.

-- ---------- Enums ----------
create type public.priority_level as enum ('high', 'medium', 'low');
create type public.contact_type as enum ('recruiter', 'hiring_manager', 'referral', 'other');
create type public.application_stage as enum ('researching', 'applied', 'interviewing', 'offer', 'rejected', 'closed');
create type public.activity_type as enum ('email', 'call', 'linkedin', 'interview', 'note');

-- ---------- Shared updated_at trigger ----------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Tables ----------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  website text,
  industry text,
  size text,
  location text,
  priority public.priority_level not null default 'medium',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  full_name text not null check (char_length(full_name) between 1 and 200),
  title text,
  contact_type public.contact_type not null default 'other',
  email text,
  linkedin_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  primary_contact_id uuid references public.contacts (id) on delete set null,
  role_title text not null check (char_length(role_title) between 1 and 200),
  job_url text,
  stage public.application_stage not null default 'researching',
  board_position double precision not null default 0,
  applied_on date,
  salary_range text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 300),
  due_date date,
  done boolean not null default false,
  company_id uuid references public.companies (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  auto_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  activity_type public.activity_type not null default 'note',
  body text not null check (char_length(body) between 1 and 5000),
  occurred_at timestamptz not null default now(),
  company_id uuid references public.companies (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  application_id uuid references public.applications (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Indexes ----------
create index on public.companies (user_id);
create index on public.contacts (user_id);
create index on public.contacts (company_id);
create index on public.applications (user_id, stage, board_position);
create index on public.applications (company_id);
create index on public.applications (primary_contact_id);
create index on public.tasks (user_id, done, due_date);
create index on public.tasks (company_id);
create index on public.tasks (contact_id);
create index on public.tasks (application_id);
create index on public.activities (user_id, occurred_at desc);
create index on public.activities (company_id);
create index on public.activities (contact_id);
create index on public.activities (application_id);

-- ---------- updated_at triggers ----------
create trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger contacts_updated_at before update on public.contacts for each row execute function public.set_updated_at();
create trigger applications_updated_at before update on public.applications for each row execute function public.set_updated_at();
create trigger tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
create trigger activities_updated_at before update on public.activities for each row execute function public.set_updated_at();

-- ---------- Row Level Security: owner-only access on every table ----------
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.applications enable row level security;
alter table public.tasks enable row level security;
alter table public.activities enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['companies', 'contacts', 'applications', 'tasks', 'activities'] loop
    execute format('create policy "Owner can read" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "Owner can delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

-- Explicit API access: logged-in users may use the tables (RLS still limits them to their own rows).
-- Written out here because the project does not grant API access to new tables automatically.
grant select, insert, update, delete on public.companies, public.contacts, public.applications, public.tasks, public.activities to authenticated;

-- Anonymous visitors get no table access at all (RLS would block them anyway).
revoke all on public.companies, public.contacts, public.applications, public.tasks, public.activities from anon;

-- ---------- Automation: follow-up task when an application moves to Applied ----------
-- Runs as the signed-in user (security invoker), so RLS still applies to the inserted task.
create function public.create_follow_up_task()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  company_name text;
begin
  if new.stage = 'applied'
     and (tg_op = 'INSERT' or old.stage is distinct from 'applied') then
    select c.name into company_name from public.companies c where c.id = new.company_id;

    insert into public.tasks (user_id, title, due_date, company_id, contact_id, application_id, auto_generated)
    values (
      new.user_id,
      'Follow up with ' || coalesce(company_name, 'company') || ' about ' || new.role_title,
      current_date + 7,
      new.company_id,
      new.primary_contact_id,
      new.id,
      true
    );
  end if;
  return null;
end;
$$;

-- Fills in applied_on (BEFORE trigger, so it can change the row).
-- The follow-up task is created in an AFTER trigger, once the application row exists.
create function public.fill_applied_on()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.stage = 'applied' and new.applied_on is null then
    new.applied_on = current_date;
  end if;
  return new;
end;
$$;

create trigger applications_fill_applied_on
  before insert or update of stage on public.applications
  for each row execute function public.fill_applied_on();

create trigger applications_follow_up
  after insert or update of stage on public.applications
  for each row execute function public.create_follow_up_task();
