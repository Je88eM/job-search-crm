-- Follow-up tasks and applied dates use Pacific time, not the server's UTC date.
-- Keep in sync with APP_TIME_ZONE in src/lib/dates.ts.

create or replace function public.fill_applied_on()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.stage = 'applied' and new.applied_on is null then
    new.applied_on = (now() at time zone 'America/Los_Angeles')::date;
  end if;
  return new;
end;
$$;

create or replace function public.create_follow_up_task()
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
      (now() at time zone 'America/Los_Angeles')::date + 7,
      new.company_id,
      new.primary_contact_id,
      new.id,
      true
    );
  end if;
  return null;
end;
$$;
