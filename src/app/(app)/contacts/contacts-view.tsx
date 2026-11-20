"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActivityTimeline } from "@/components/app/activity-timeline";
import { PageHeader } from "@/components/app/page-header";
import { ContactTypeBadge } from "@/components/app/badges";
import { safeHref } from "@/lib/form-utils";
import type { ActivityRow, Contact } from "@/lib/types";
import { ContactForm, type CompanyOption } from "./contact-form";

export type ContactRow = Contact & { company: CompanyOption | null; activities: ActivityRow[] };

export function ContactsView({
  contacts,
  companies,
  initialOpenId,
  startNew,
  today,
  defaultCompanyId,
}: {
  contacts: ContactRow[];
  companies: CompanyOption[];
  initialOpenId: string | null;
  startNew: boolean;
  today: string;
  defaultCompanyId: string | null;
}) {
  // null = panel closed, "new" = adding a contact, otherwise the id of the contact being edited
  const [openId, setOpenId] = useState<string | null>(() => {
    if (startNew) return "new";
    return initialOpenId && contacts.some((c) => c.id === initialOpenId) ? initialOpenId : null;
  });
  const selected = openId && openId !== "new" ? contacts.find((c) => c.id === openId) ?? null : null;
  const linkedin = safeHref(selected?.linkedin_url ?? null);

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Recruiters, hiring managers and referrals."
        action={
          <Button onClick={() => setOpenId("new")}>
            <Plus /> New contact
          </Button>
        }
      />

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">No contacts here yet. Add a recruiter or hiring manager.</p>
          <Button variant="outline" onClick={() => setOpenId("new")}>
            <Plus /> New contact
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setOpenId(c.id)}>
                  <TableCell className="font-medium">{c.full_name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.title}</TableCell>
                  <TableCell>{c.company?.name}</TableCell>
                  <TableCell>
                    <ContactTypeBadge type={c.contact_type} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={openId !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected ? selected.full_name : "New contact"}</SheetTitle>
            <SheetDescription>
              {selected?.company ? (
                <Link href={`/companies?open=${selected.company.id}`} className="underline-offset-4 hover:underline">
                  {selected.company.name}
                </Link>
              ) : (
                "Someone who can help you get hired."
              )}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6 px-4 pb-6">
            {(selected?.email || linkedin) && (
              <div className="flex flex-wrap gap-4 text-sm">
                {selected?.email && (
                  <a href={`mailto:${selected.email}`} className="text-primary underline-offset-4 hover:underline">
                    {selected.email}
                  </a>
                )}
                {linkedin && (
                  <a
                    href={linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                  >
                    LinkedIn <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            )}
            <ContactForm
              key={openId ?? "closed"}
              contact={selected}
              companies={companies}
              defaultCompanyId={defaultCompanyId}
              onDone={() => setOpenId(null)}
            />
            {selected && (
              <ActivityTimeline activities={selected.activities} subject={{ contactId: selected.id }} today={today} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
