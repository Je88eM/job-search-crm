-- Only one open follow-up per application.
-- Before: every move into Applied (e.g. dragging a card out and back in) created another
-- "Follow up with …" task, even if an open one already existed.
-- After: a new follow-up is only created if the application has no open auto-generated task.
-- A completed follow-up doesn't count, so re-applying after it's done still creates a fresh one.

create or replace function public.create_follow_up_task()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  company_name text;
begin
  if new.stage = 'applied'
     and (tg_op = 'INSERT' or old.stage is distinct from 'applied')
     and not exists (
       select 1 from public.tasks t
       where t.application_id = new.id
         and t.auto_generated
         and not t.done
     ) then
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

-- One-time cleanup: remove duplicate open follow-ups that already exist,
-- keeping the oldest one per application. Manual tasks and completed tasks are untouched.
delete from public.tasks t
using public.tasks keep
where t.application_id = keep.application_id
  and t.auto_generated and keep.auto_generated
  and not t.done and not keep.done
  and (keep.created_at, keep.id) < (t.created_at, t.id);
