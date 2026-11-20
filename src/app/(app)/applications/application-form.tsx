"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { STAGES, STAGE_LABELS, initialFormState, type Application } from "@/lib/types";
import { deleteApplication, saveApplication } from "./actions";

export type CompanyOption = { id: string; name: string };
export type ContactOption = { id: string; full_name: string; company_id: string | null };

export function ApplicationForm({
  application,
  companies,
  contacts,
  onDone,
}: {
  application: Application | null;
  companies: CompanyOption[];
  contacts: ContactOption[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveApplication, initialFormState);
  const [deleting, startDelete] = useTransition();
  const [companyId, setCompanyId] = useState(application?.company_id ?? "");
  const [stage, setStage] = useState(application?.stage ?? "researching");

  // Contacts at the chosen company come first in the list.
  const sortedContacts = [...contacts].sort(
    (a, b) => Number(b.company_id === companyId) - Number(a.company_id === companyId),
  );
  const companyName = (id: string | null) => companies.find((c) => c.id === id)?.name;

  useEffect(() => {
    if (state.ok && state.savedAt) {
      const becameApplied = stage === "applied" && application?.stage !== "applied";
      toast.success(application ? "Application updated" : "Application added", {
        description: becameApplied ? "Follow-up task created for 7 days from now." : undefined,
      });
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.savedAt]);

  function handleDelete() {
    if (!application) return;
    if (!confirm(`Delete the ${application.role_title} application? Linked tasks and activities are kept.`)) return;
    startDelete(async () => {
      const result = await deleteApplication(application.id);
      if (result.ok) {
        toast.success("Application deleted");
        onDone();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {application && <input type="hidden" name="id" value={application.id} />}
      <Field label="Role *" htmlFor="role_title">
        <Input id="role_title" name="role_title" defaultValue={application?.role_title} required maxLength={200} autoFocus placeholder="e.g. GTM Engineer" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Company *" htmlFor="company_id">
          <NativeSelect id="company_id" name="company_id" value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
            <option value="" disabled>
              Pick a company
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Stage" htmlFor="stage">
          <NativeSelect id="stage" name="stage" value={stage} onChange={(e) => setStage(e.target.value as typeof stage)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Main contact" htmlFor="primary_contact_id">
        <NativeSelect id="primary_contact_id" name="primary_contact_id" defaultValue={application?.primary_contact_id ?? ""}>
          <option value="">None</option>
          {sortedContacts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
              {companyName(p.company_id) ? ` (${companyName(p.company_id)})` : ""}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Job posting link" htmlFor="job_url">
        <Input id="job_url" name="job_url" defaultValue={application?.job_url ?? ""} placeholder="https://..." />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Applied on" htmlFor="applied_on">
          <Input id="applied_on" name="applied_on" type="date" defaultValue={application?.applied_on ?? ""} />
        </Field>
        <Field label="Salary range" htmlFor="salary_range">
          <Input id="salary_range" name="salary_range" defaultValue={application?.salary_range ?? ""} placeholder="e.g. $120-150k" />
        </Field>
      </div>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={application?.notes ?? ""} rows={4} placeholder="Interview prep, questions to ask..." />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending || deleting}>
          {pending ? "Saving..." : application ? "Save changes" : "Add application"}
        </Button>
        {application && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending || deleting} className="ml-auto">
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </form>
  );
}
