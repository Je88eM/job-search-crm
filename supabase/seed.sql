-- Demo data for screenshots and the Loom walkthrough. ALL FICTIONAL: invented companies and people,
-- example.com emails (a domain reserved for examples). Never put real people's details here.
--
-- How to use:
--   1. In Supabase: Authentication -> Users -> Add user -> email demo@example.com (Auto Confirm).
--   2. Run this whole file in the SQL Editor. It only touches the demo user's rows.
--   3. Run it again any time to reset the demo account to this exact state.
-- Dates are relative to today, so the dashboard always looks "live".

do $$
declare
  demo uuid;
  today date := (now() at time zone 'America/Los_Angeles')::date;
  c_northwind uuid; c_bluebird uuid; c_pinecrest uuid; c_lumen uuid; c_harbor uuid; c_atlas uuid;
  p_maya uuid; p_omar uuid; p_lena uuid; p_dev uuid; p_sofia uuid; p_theo uuid; p_aria uuid;
  a_northwind uuid; a_bluebird uuid; a_pinecrest uuid; a_lumen uuid; a_harbor uuid; a_atlas uuid; a_atlas2 uuid; a_pine2 uuid;
begin
  select id into demo from auth.users where email = 'demo@example.com';
  if demo is null then
    raise exception 'Create the demo user first: Authentication -> Users -> Add user -> demo@example.com';
  end if;

  -- Start fresh (demo user's rows only).
  delete from public.activities where user_id = demo;
  delete from public.tasks where user_id = demo;
  delete from public.applications where user_id = demo;
  delete from public.contacts where user_id = demo;
  delete from public.companies where user_id = demo;

  -- ---------- Companies ----------
  insert into public.companies (user_id, name, website, industry, size, location, priority, notes)
  values (demo, 'Northwind Analytics', 'https://northwind.example.com', 'Revenue intelligence', '200-500', 'San Francisco', 'high',
          'Series C, building out a GTM engineering team. Uses Clay and HubSpot.')
  returning id into c_northwind;
  insert into public.companies (user_id, name, website, industry, size, location, priority, notes)
  values (demo, 'Bluebird Revenue', 'https://bluebird.example.com', 'Sales tech', '50-200', 'Remote (US)', 'high',
          'Fast-growing outbound platform. Posted a GTM Engineer role last week.')
  returning id into c_bluebird;
  insert into public.companies (user_id, name, website, industry, size, location, priority, notes)
  values (demo, 'Pinecrest Data', 'https://pinecrest.example.com', 'Data enrichment', '50-200', 'Oakland', 'medium',
          'Data provider. Strong overlap with Clay workflows.')
  returning id into c_pinecrest;
  insert into public.companies (user_id, name, website, industry, size, location, priority, notes)
  values (demo, 'Lumen Outbound', 'https://lumen.example.com', 'Agency', '10-50', 'San Francisco', 'medium',
          'GTM agency, hires engineers to run client campaigns.')
  returning id into c_lumen;
  insert into public.companies (user_id, name, website, industry, size, location, priority, notes)
  values (demo, 'Harbor & Pike Software', 'https://harborpike.example.com', 'Vertical SaaS', '500-1000', 'San Jose', 'low', null)
  returning id into c_harbor;
  insert into public.companies (user_id, name, website, industry, size, location, priority, notes)
  values (demo, 'Atlas Signal', 'https://atlassignal.example.com', 'Intent data', '200-500', 'San Francisco', 'high',
          'A friend works here and offered a referral.')
  returning id into c_atlas;

  -- ---------- Contacts ----------
  insert into public.contacts (user_id, company_id, full_name, title, contact_type, email, linkedin_url, notes)
  values (demo, c_northwind, 'Maya Chen', 'Senior Technical Recruiter', 'recruiter', 'maya.chen@example.com', 'https://www.linkedin.com/in/example-maya', 'Very responsive, prefers email.')
  returning id into p_maya;
  insert into public.contacts (user_id, company_id, full_name, title, contact_type, email, linkedin_url, notes)
  values (demo, c_northwind, 'Omar Haddad', 'Head of RevOps', 'hiring_manager', 'omar.haddad@example.com', null, 'Hiring manager for the GTM Engineer role.')
  returning id into p_omar;
  insert into public.contacts (user_id, company_id, full_name, title, contact_type, email, linkedin_url, notes)
  values (demo, c_bluebird, 'Lena Fischer', 'Talent Partner', 'recruiter', 'lena@example.com', null, null)
  returning id into p_lena;
  insert into public.contacts (user_id, company_id, full_name, title, contact_type, email, linkedin_url, notes)
  values (demo, c_atlas, 'Dev Patel', 'Solutions Engineer', 'referral', 'dev.patel@example.com', null, 'Met at a meetup. Offered to refer me.')
  returning id into p_dev;
  insert into public.contacts (user_id, company_id, full_name, title, contact_type, email, linkedin_url, notes)
  values (demo, c_atlas, 'Sofia Romero', 'VP of Sales', 'hiring_manager', 'sofia.romero@example.com', null, null)
  returning id into p_sofia;
  insert into public.contacts (user_id, company_id, full_name, title, contact_type, email, linkedin_url, notes)
  values (demo, c_pinecrest, 'Theo Brooks', 'Recruiting Coordinator', 'recruiter', 'theo@example.com', null, null)
  returning id into p_theo;
  insert into public.contacts (user_id, company_id, full_name, title, contact_type, email, linkedin_url, notes)
  values (demo, c_lumen, 'Aria Novak', 'Founder', 'hiring_manager', 'aria@example.com', null, 'Runs a 12-person GTM agency.')
  returning id into p_aria;

  -- ---------- Applications (inserting with stage 'applied' also creates a follow-up task) ----------
  insert into public.applications (user_id, company_id, primary_contact_id, role_title, job_url, stage, board_position, applied_on, salary_range, notes)
  values (demo, c_northwind, p_omar, 'GTM Engineer', 'https://northwind.example.com/careers/gtm-engineer', 'interviewing', 1, today - 16, '$140-170k',
          'Second round: build a Clay table live. Prep enrichment waterfall examples.')
  returning id into a_northwind;
  insert into public.applications (user_id, company_id, primary_contact_id, role_title, job_url, stage, board_position, applied_on, salary_range)
  values (demo, c_bluebird, p_lena, 'GTM Engineer', 'https://bluebird.example.com/jobs/42', 'applied', 1, today - 3, '$120-150k')
  returning id into a_bluebird;
  insert into public.applications (user_id, company_id, primary_contact_id, role_title, stage, board_position, applied_on, updated_at)
  values (demo, c_pinecrest, p_theo, 'Growth Engineer', 'applied', 2, today - 12, now() - interval '12 days')
  returning id into a_pinecrest;
  insert into public.applications (user_id, company_id, primary_contact_id, role_title, stage, board_position, salary_range, notes)
  values (demo, c_lumen, p_aria, 'Clay Specialist', 'offer', 1, '$110k + bonus', 'Verbal offer. Asked for the written offer by Friday.')
  returning id into a_lumen;
  insert into public.applications (user_id, company_id, role_title, stage, board_position)
  values (demo, c_harbor, 'Sales Ops Analyst', 'researching', 2)
  returning id into a_harbor;
  insert into public.applications (user_id, company_id, primary_contact_id, role_title, stage, board_position, notes)
  values (demo, c_atlas, p_dev, 'GTM Engineer', 'researching', 1, 'Waiting on Dev''s referral before applying.')
  returning id into a_atlas;
  insert into public.applications (user_id, company_id, primary_contact_id, role_title, stage, board_position, applied_on, updated_at)
  values (demo, c_atlas, p_sofia, 'Revenue Operations Manager', 'interviewing', 2, today - 21, now() - interval '9 days')
  returning id into a_atlas2;
  insert into public.applications (user_id, company_id, role_title, stage, board_position, applied_on)
  values (demo, c_pinecrest, 'Solutions Engineer', 'rejected', 1, today - 30)
  returning id into a_pine2;

  -- ---------- Tasks (one per state: overdue, today, upcoming, done) ----------
  insert into public.tasks (user_id, title, due_date, done, company_id, contact_id, application_id) values
    (demo, 'Send thank-you note to Omar after round 1', today - 2, false, c_northwind, p_omar, a_northwind),
    (demo, 'Ask Dev for the referral link', today - 1, false, c_atlas, p_dev, a_atlas),
    (demo, 'Prep Clay live-build demo for round 2', today, false, c_northwind, null, a_northwind),
    (demo, 'Review the written offer from Lumen', today, false, c_lumen, p_aria, a_lumen),
    (demo, 'Research Harbor & Pike''s sales tech stack', today + 3, false, c_harbor, null, a_harbor),
    (demo, 'Update portfolio with the CRM build', today + 5, false, null, null, null),
    (demo, 'Connect with Maya on LinkedIn', today - 6, true, c_northwind, p_maya, null);

  -- ---------- Activities ----------
  insert into public.activities (user_id, activity_type, body, occurred_at, company_id, contact_id, application_id) values
    (demo, 'email', 'Intro email to Maya with my portfolio link.', now() - interval '18 days', c_northwind, p_maya, null),
    (demo, 'call', 'Recruiter screen with Maya. Next step: meet Omar.', now() - interval '14 days', c_northwind, p_maya, a_northwind),
    (demo, 'interview', 'Round 1 with Omar: talked through enrichment waterfalls and lead routing.', now() - interval '3 days', c_northwind, p_omar, a_northwind),
    (demo, 'linkedin', 'Messaged Lena after applying.', now() - interval '2 days', c_bluebird, p_lena, a_bluebird),
    (demo, 'note', 'Offer call with Aria. Base plus bonus, start in January.', now() - interval '1 day', c_lumen, p_aria, a_lumen),
    (demo, 'interview', 'First interview with Sofia. Strong fit on RevOps tooling.', now() - interval '9 days', c_atlas, p_sofia, a_atlas2),
    (demo, 'email', 'Applied through the careers page.', now() - interval '12 days', c_pinecrest, p_theo, a_pinecrest),
    (demo, 'linkedin', 'Dev offered to refer me for the GTM Engineer role.', now() - interval '5 days', c_atlas, p_dev, a_atlas);
end;
$$;
