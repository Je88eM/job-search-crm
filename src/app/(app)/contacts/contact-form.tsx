"use client";

import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { CONTACT_TYPE_LABELS, initialFormState, type Contact } from "@/lib/types";
import { deleteContact, saveContact } from "./actions";

export type CompanyOption = { id: string; name: string };

export function ContactForm({
  contact,
  companies,
  defaultCompanyId,
  onDone,
}: {
  contact: Contact | null;
  companies: CompanyOption[];
  defaultCompanyId: string | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveContact, initialFormState);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.ok && state.savedAt) {
      toast.success(contact ? "Contact updated" : "Contact added");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.savedAt]);

  function handleDelete() {
    if (!contact) return;
    if (!confirm(`Delete ${contact.full_name}? Linked tasks and activities are kept.`)) return;
    startDelete(async () => {
      const result = await deleteContact(contact.id);
      if (result.ok) {
        toast.success("Contact deleted");
        onDone();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {contact && <input type="hidden" name="id" value={contact.id} />}
      <Field label="Name *" htmlFor="full_name">
        <Input id="full_name" name="full_name" defaultValue={contact?.full_name} required maxLength={200} autoFocus />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Title" htmlFor="title">
          <Input id="title" name="title" defaultValue={contact?.title ?? ""} placeholder="e.g. Head of RevOps" />
        </Field>
        <Field label="Type" htmlFor="contact_type">
          <NativeSelect id="contact_type" name="contact_type" defaultValue={contact?.contact_type ?? "recruiter"}>
            {Object.entries(CONTACT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="Company" htmlFor="company_id">
        <NativeSelect id="company_id" name="company_id" defaultValue={contact?.company_id ?? defaultCompanyId ?? ""}>
          <option value="">No company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} />
      </Field>
      <Field label="LinkedIn" htmlFor="linkedin_url">
        <Input id="linkedin_url" name="linkedin_url" defaultValue={contact?.linkedin_url ?? ""} placeholder="linkedin.com/in/..." />
      </Field>
      <Field label="Notes" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={contact?.notes ?? ""} rows={4} placeholder="How you met, what you talked about..." />
      </Field>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending || deleting}>
          {pending ? "Saving..." : contact ? "Save changes" : "Add contact"}
        </Button>
        {contact && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending || deleting} className="ml-auto">
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </form>
  );
}
