"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, KanbanSquare, Plus, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActivityTimeline } from "@/components/app/activity-timeline";
import { PageHeader } from "@/components/app/page-header";
import { StageBadge } from "@/components/app/badges";
import { safeHref } from "@/lib/form-utils";
import { cn } from "@/lib/utils";
import type { ActivityRow, Application } from "@/lib/types";
import { ApplicationForm, type CompanyOption, type ContactOption } from "./application-form";
import { Board } from "./board";
import { formatDate } from "@/lib/dates";

export type ApplicationRow = Application & {
  company: { id: string; name: string } | null;
  contact: { id: string; full_name: string } | null;
  activities: ActivityRow[];
};

export function ApplicationsView({
  applications,
  companies,
  contacts,
  view,
  today,
  initialOpenId,
}: {
  applications: ApplicationRow[];
  companies: CompanyOption[];
  contacts: ContactOption[];
  view: "board" | "table";
  today: string;
  initialOpenId: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(
    initialOpenId && applications.some((a) => a.id === initialOpenId) ? initialOpenId : null,
  );
  const selected = openId && openId !== "new" ? applications.find((a) => a.id === openId) ?? null : null;
  const jobUrl = safeHref(selected?.job_url ?? null);

  return (
    <>
      <PageHeader
        title="Applications"
        description="Every role you're pursuing, from research to offer."
        action={
          <div className="flex items-center gap-2">
            <ViewToggle view={view} />
            <Button onClick={() => setOpenId("new")} disabled={companies.length === 0}>
              <Plus /> New application
            </Button>
          </div>
        }
      />

      {companies.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">Applications belong to a company. Add a company first.</p>
          <Link href="/companies" className="text-sm text-primary underline-offset-4 hover:underline">
            Go to Companies
          </Link>
        </div>
      ) : view === "board" ? (
        <Board applications={applications} onOpen={setOpenId} />
      ) : (
        <ApplicationsTable applications={applications} onOpen={setOpenId} />
      )}

      <Sheet open={openId !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected ? selected.role_title : "New application"}</SheetTitle>
            <SheetDescription>
              {selected?.company ? (
                <Link href={`/companies?open=${selected.company.id}`} className="underline-offset-4 hover:underline">
                  {selected.company.name}
                </Link>
              ) : (
                "A role you're interested in."
              )}
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-6 px-4 pb-6">
            {jobUrl && (
              <a
                href={jobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
              >
                View job posting <ExternalLink className="size-3" />
              </a>
            )}
            <ApplicationForm
              key={openId ?? "closed"}
              application={selected}
              companies={companies}
              contacts={contacts}
              onDone={() => setOpenId(null)}
            />
            {selected && (
              <ActivityTimeline activities={selected.activities} subject={{ applicationId: selected.id }} today={today} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ViewToggle({ view }: { view: "board" | "table" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(next: "board" | "table") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "board") params.delete("view");
    else params.set("view", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const base = "inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors";
  return (
    <div className="flex rounded-lg border p-0.5" role="group" aria-label="View">
      <button type="button" aria-pressed={view === "board"} onClick={() => setView("board")} className={cn(base, view === "board" ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground")}>
        <KanbanSquare className="size-4" /> Board
      </button>
      <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")} className={cn(base, view === "table" ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground")}>
        <Table2 className="size-4" /> Table
      </button>
    </div>
  );
}

function ApplicationsTable({ applications, onOpen }: { applications: ApplicationRow[]; onOpen: (id: string) => void }) {
  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
        No applications here yet.
      </div>
    );
  }
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Main contact</TableHead>
            <TableHead>Applied</TableHead>
            <TableHead>Salary</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((a) => (
            <TableRow key={a.id} className="cursor-pointer" onClick={() => onOpen(a.id)}>
              <TableCell className="font-medium">{a.role_title}</TableCell>
              <TableCell>{a.company?.name}</TableCell>
              <TableCell>
                <StageBadge stage={a.stage} />
              </TableCell>
              <TableCell className="text-muted-foreground">{a.contact?.full_name}</TableCell>
              <TableCell className="text-muted-foreground">{a.applied_on ? formatDate(a.applied_on) : ""}</TableCell>
              <TableCell className="text-muted-foreground">{a.salary_range}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
