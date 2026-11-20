import { createClient } from "@/lib/supabase/server";
import { FilterBar } from "@/components/app/filter-bar";
import { todayISO } from "@/lib/dates";
import { first, isUuid } from "@/lib/form-utils";
import { ACTIVITIES_EMBED } from "@/lib/queries";
import { PRIORITY_LABELS, type Priority } from "@/lib/types";
import { CompaniesView, type CompanyRow } from "./companies-view";

export default async function CompaniesPage({ searchParams }: PageProps<"/companies">) {
  const params = await searchParams;
  const q = first(params.q)?.trim();
  const priority = first(params.priority);
  const open = first(params.open);

  const supabase = await createClient();
  const today = todayISO();
  let query = supabase
    .from("companies")
    .select(`*, contacts(id, full_name, title, contact_type), applications(count), ${ACTIVITIES_EMBED}`)
    .order("name");

  if (q) query = query.ilike("name", `%${q}%`);
  if (priority && priority in PRIORITY_LABELS) query = query.eq("priority", priority as Priority);

  const { data, error } = await query;
  if (error) throw new Error("Couldn't load companies.");

  const companies: CompanyRow[] = (data ?? []).map(({ applications, ...c }) => ({
    ...c,
    application_count: applications?.[0]?.count ?? 0,
  }));

  return (
    <>
      <FilterBar
        placeholder="Search companies..."
        selects={[
          {
            param: "priority",
            label: "Priority",
            options: Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
          },
        ]}
      />
      <CompaniesView companies={companies} today={today} initialOpenId={isUuid(open) ? open : null} />
    </>
  );
}
