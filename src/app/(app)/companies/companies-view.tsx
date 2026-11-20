"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActivityTimeline } from "@/components/app/activity-timeline";
import { PageHeader } from "@/components/app/page-header";
import { ContactTypeBadge, PriorityBadge } from "@/components/app/badges";
import { safeHref } from "@/lib/form-utils";
import type { ActivityRow, Company, ContactType } from "@/lib/types";
import { CompanyForm } from "./company-form";

export type CompanyRow = Company & {
  contacts: { id: string; full_name: string; title: string | null; contact_type: ContactType }[];
  application_count: number;
  activities: ActivityRow[];
};

export function CompaniesView({
  companies,
  today,
  initialOpenId,
}: {
  companies: CompanyRow[];
  today: string;
  initialOpenId: string | null;
}) {
  // null = panel closed, "new" = adding a company, otherwise the id of the company being edited
  const [openId, setOpenId] = useState<string | null>(
    initialOpenId && companies.some((c) => c.id === initialOpenId) ? initialOpenId : null,
  );
  const selected = openId && openId !== "new" ? companies.find((c) => c.id === openId) ?? null : null;
  const website = safeHref(selected?.website ?? null);

  return (
    <>
      <PageHeader
        title="Companies"
        description="Target companies for your job search."
        action={
          <Button onClick={() => setOpenId("new")}>
            <Plus /> New company
          </Button>
        }
      />

      {companies.length === 0 ? (
        <EmptyState onAdd={() => setOpenId("new")} />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Contacts</TableHead>
                <TableHead className="text-right">Applications</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpenId(c.id)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <PriorityBadge priority={c.priority} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.industry}</TableCell>
                  <TableCell className="text-muted-foreground">{c.location}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.contacts.length}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.application_count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={openId !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected ? selected.name : "New company"}</SheetTitle>
            <SheetDescription>
              {selected ? "Edit details, or see who you know here." : "Add a company you'd like to work for."}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6 px-4 pb-6">
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
              >
                {website} <ExternalLink className="size-3" />
              </a>
            )}
            <CompanyForm key={openId ?? "closed"} company={selected} onDone={() => setOpenId(null)} />
            {selected && <LinkedContacts company={selected} />}
            {selected && (
              <ActivityTimeline activities={selected.activities} subject={{ companyId: selected.id }} today={today} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function LinkedContacts({ company }: { company: CompanyRow }) {
  return (
    <section className="flex flex-col gap-2 border-t pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Contacts ({company.contacts.length})</h3>
        <Link
          href={`/contacts?new=1&company=${company.id}`}
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          + Add contact
        </Link>
      </div>
      {company.contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contacts at {company.name} yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {company.contacts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/contacts?open=${p.id}`}
                className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              >
                <span className="truncate">
                  {p.full_name}
                  {p.title && <span className="text-muted-foreground"> · {p.title}</span>}
                </span>
                <ContactTypeBadge type={p.contact_type} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
      <p className="text-sm text-muted-foreground">No companies here yet. Add your first target company.</p>
      <Button variant="outline" onClick={onAdd}>
        <Plus /> New company
      </Button>
    </div>
  );
}
