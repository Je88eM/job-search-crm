import { createClient } from "@/lib/supabase/server";
import { FilterBar } from "@/components/app/filter-bar";
import { addDays, todayISO } from "@/lib/dates";
import { first, isUuid } from "@/lib/form-utils";
import { TASK_SELECT } from "@/lib/queries";
import type { TaskRow } from "@/lib/types";
import { TasksView } from "./tasks-view";

export default async function TasksPage({ searchParams }: PageProps<"/tasks">) {
  const params = await searchParams;
  const q = first(params.q)?.trim();
  const show = first(params.show); // "" = open (default), "done", "all"
  const due = first(params.due); // "overdue", "today", "week"
  const company = first(params.company);
  const open = first(params.open);

  const supabase = await createClient(); // connect first: marks the page as per-request
  const today = todayISO();
  let query = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("done")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at");

  // A task opened by link (e.g. from Today) is shown even if it doesn't match the filters.
  if (!isUuid(open)) {
    if (show === "done") query = query.eq("done", true);
    else if (show !== "all") query = query.eq("done", false);
    if (q) query = query.ilike("title", `%${q}%`);
    if (due === "overdue") query = query.lt("due_date", today);
    if (due === "today") query = query.eq("due_date", today);
    if (due === "week") query = query.lte("due_date", addDays(today, 7));
    if (isUuid(company)) query = query.eq("company_id", company);
  }

  const [tasksResult, companies, contacts, applications] = await Promise.all([
    query,
    supabase.from("companies").select("id, name").order("name"),
    supabase.from("contacts").select("id, full_name").order("full_name"),
    supabase.from("applications").select("id, role_title, company:companies(name)").order("role_title"),
  ]);
  if (tasksResult.error || companies.error || contacts.error || applications.error) {
    throw new Error("Couldn't load tasks.");
  }

  return (
    <>
      <FilterBar
        placeholder="Search tasks..."
        selects={[
          {
            param: "show",
            label: "Show",
            allLabel: "Open tasks",
            options: [
              { value: "done", label: "Completed" },
              { value: "all", label: "All tasks" },
            ],
          },
          {
            param: "due",
            label: "Due",
            allLabel: "Any due date",
            options: [
              { value: "overdue", label: "Overdue" },
              { value: "today", label: "Due today" },
              { value: "week", label: "Due within 7 days" },
            ],
          },
          {
            param: "company",
            label: "Company",
            options: (companies.data ?? []).map((c) => ({ value: c.id, label: c.name })),
          },
        ]}
      />
      <TasksView
        tasks={(tasksResult.data ?? []) as TaskRow[]}
        options={{
          companies: companies.data ?? [],
          contacts: contacts.data ?? [],
          applications: (applications.data ?? []) as unknown as LinkApplications,
        }}
        today={today}
        initialOpenId={isUuid(open) ? open : null}
      />
    </>
  );
}

type LinkApplications = { id: string; role_title: string; company: { name: string } | null }[];
