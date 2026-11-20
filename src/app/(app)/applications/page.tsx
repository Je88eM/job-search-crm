import { createClient } from "@/lib/supabase/server";
import { FilterBar } from "@/components/app/filter-bar";
import { todayISO } from "@/lib/dates";
import { first, isUuid } from "@/lib/form-utils";
import { ACTIVITIES_EMBED } from "@/lib/queries";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/types";
import { ApplicationsView, type ApplicationRow } from "./applications-view";

export default async function ApplicationsPage({ searchParams }: PageProps<"/applications">) {
  const params = await searchParams;
  const q = first(params.q)?.trim();
  const stage = first(params.stage);
  const company = first(params.company);
  const open = first(params.open);
  const view = first(params.view) === "table" ? "table" : "board";

  const supabase = await createClient();
  const today = todayISO();
  let query = supabase
    .from("applications")
    .select(`*, company:companies(id, name), contact:contacts(id, full_name), ${ACTIVITIES_EMBED}`)
    .order("board_position");

  if (q) query = query.ilike("role_title", `%${q}%`);
  if (stage && (STAGES as readonly string[]).includes(stage)) query = query.eq("stage", stage as Stage);
  if (isUuid(company)) query = query.eq("company_id", company);

  const [applicationsResult, companiesResult, contactsResult] = await Promise.all([
    query,
    supabase.from("companies").select("id, name").order("name"),
    supabase.from("contacts").select("id, full_name, company_id").order("full_name"),
  ]);
  if (applicationsResult.error || companiesResult.error || contactsResult.error) {
    throw new Error("Couldn't load applications.");
  }

  const companies = companiesResult.data ?? [];

  return (
    <>
      <FilterBar
        placeholder="Search roles..."
        selects={[
          {
            param: "stage",
            label: "Stage",
            options: STAGES.map((s) => ({ value: s, label: STAGE_LABELS[s] })),
          },
          {
            param: "company",
            label: "Company",
            options: companies.map((c) => ({ value: c.id, label: c.name })),
          },
        ]}
      />
      <ApplicationsView
        applications={(applicationsResult.data ?? []) as ApplicationRow[]}
        companies={companies}
        contacts={contactsResult.data ?? []}
        view={view}
        today={today}
        initialOpenId={isUuid(open) ? open : null}
      />
    </>
  );
}
