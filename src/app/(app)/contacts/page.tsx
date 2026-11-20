import { createClient } from "@/lib/supabase/server";
import { FilterBar } from "@/components/app/filter-bar";
import { todayISO } from "@/lib/dates";
import { first, isUuid } from "@/lib/form-utils";
import { ACTIVITIES_EMBED } from "@/lib/queries";
import { CONTACT_TYPE_LABELS, type ContactType } from "@/lib/types";
import { ContactsView, type ContactRow } from "./contacts-view";

export default async function ContactsPage({ searchParams }: PageProps<"/contacts">) {
  const params = await searchParams;
  const q = first(params.q)?.trim();
  const type = first(params.type);
  const company = first(params.company);
  const open = first(params.open);
  const startNew = first(params.new) === "1";

  const supabase = await createClient();
  const today = todayISO();
  let query = supabase.from("contacts").select(`*, company:companies(id, name), ${ACTIVITIES_EMBED}`).order("full_name");

  if (q) query = query.ilike("full_name", `%${q}%`);
  if (type && type in CONTACT_TYPE_LABELS) query = query.eq("contact_type", type as ContactType);
  // When adding a contact from a company's panel, the company is preselected rather than filtered.
  if (isUuid(company) && !startNew) query = query.eq("company_id", company);

  const [contactsResult, companiesResult] = await Promise.all([
    query,
    supabase.from("companies").select("id, name").order("name"),
  ]);
  if (contactsResult.error || companiesResult.error) throw new Error("Couldn't load contacts.");

  const companies = companiesResult.data ?? [];

  return (
    <>
      <FilterBar
        placeholder="Search contacts..."
        selects={[
          {
            param: "type",
            label: "Type",
            options: Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
          },
          {
            param: "company",
            label: "Company",
            options: companies.map((c) => ({ value: c.id, label: c.name })),
          },
        ]}
      />
      <ContactsView
        contacts={(contactsResult.data ?? []) as ContactRow[]}
        companies={companies}
        initialOpenId={isUuid(open) ? open : null}
        startNew={startNew}
        today={today}
        defaultCompanyId={isUuid(company) ? company : null}
      />
    </>
  );
}
