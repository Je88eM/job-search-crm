"use client";

import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { PRIORITY_LABELS, initialFormState, type Company } from "@/lib/types";
import { deleteCompany, saveCompany } from "./actions";

export function CompanyForm({ company, onDone }: { company: Company | null; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(saveCompany, initialFormState);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.ok && state.savedAt) {
      toast.success(company ? "Company updated" : "Company added");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.savedAt]);

  function handleDelete() {
    if (!company) return;
    if (!confirm(`Delete ${company.name}? Its applications are deleted too. Contacts and tasks are kept.`)) return;
    startDelete(async () => {
      const result = await deleteCompany(company.id);
      if (result.ok) {
        toast.success("Company deleted");
        onDone();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {company && <input type="hidden" name="id" value={company.id} />}
      <Field label="Company name *" htmlFor="name">
        <Input id="name" name="name" defaultValue={company?.name} required maxLength={200} autoFocus />
      </Field>
      <Field label="Website" htmlFor="website">
        <Input id="website" name="website" defaultValue={company?.website ?? ""} placeholder="example.com" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Priority" htmlFor="priority">
          <NativeSelect id="priority" name="priority" defaultValue={company?.priority ?? "medium"}>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Size" htmlFor="size">
          <Input id="size" name="size" defaultValue={company?.size ?? ""} placeholder="e.g. 50-200" />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Industry" htmlFor="industry">
          <Input id="industry" name="industry" defaultValue={company?.industry ?? ""} placeholder="e.g. Sales tech" />
        </Field>
        <Field label="Location" htmlFor="location">
          <Input id="location" name="location" defaultValue={company?.location ?? ""} placeholder="e.g. San Francisco" />
        </Field>
      </div>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={company?.notes ?? ""} rows={4} placeholder="Why this company? Who do you know there?" />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending || deleting}>
          {pending ? "Saving..." : company ? "Save changes" : "Add company"}
        </Button>
        {company && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending || deleting} className="ml-auto">
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </form>
  );
}
