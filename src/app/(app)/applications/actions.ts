"use server";

import { revalidateApp } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { isUuid, oneOf, text, url, uuid } from "@/lib/form-utils";
import { STAGES, type FormState, type Stage } from "@/lib/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Creates an application, or updates it when the form includes an id.
// Moving to "Applied" creates a follow-up task automatically (database trigger).
export async function saveApplication(_prev: FormState, formData: FormData): Promise<FormState> {
  const roleTitle = text(formData, "role_title", 200);
  if (!roleTitle) return { ok: false, error: "Role title is required." };

  const companyId = uuid(formData, "company_id");
  if (!companyId) return { ok: false, error: "Pick a company." };

  const jobUrl = url(formData, "job_url");
  if (jobUrl.error) return { ok: false, error: jobUrl.error };

  const appliedOn = text(formData, "applied_on", 10);
  if (appliedOn && !DATE.test(appliedOn)) return { ok: false, error: "Applied date isn't a valid date." };

  const fields = {
    role_title: roleTitle,
    company_id: companyId,
    primary_contact_id: uuid(formData, "primary_contact_id"),
    stage: oneOf(formData, "stage", STAGES, "researching"),
    job_url: jobUrl.value,
    applied_on: appliedOn,
    salary_range: text(formData, "salary_range", 100),
    notes: text(formData, "notes", 5000),
  };

  const supabase = await createClient();
  const id = uuid(formData, "id");
  const { error } = id
    ? await supabase.from("applications").update(fields).eq("id", id)
    : await supabase.from("applications").insert({ ...fields, board_position: Date.now() });

  if (error) return { ok: false, error: "Couldn't save the application. Please try again." };

  revalidateApp();
  return { ok: true, error: null, savedAt: Date.now() };
}

// Called when a card is dropped on the board. New position = end of the target column.
export async function moveApplication(id: string, stage: Stage): Promise<FormState> {
  if (!isUuid(id) || !STAGES.includes(stage)) return { ok: false, error: "Invalid move." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("applications")
    .update({ stage, board_position: Date.now() })
    .eq("id", id);

  if (error) return { ok: false, error: "Couldn't move the application." };

  revalidateApp();
  return { ok: true, error: null, savedAt: Date.now() };
}

export async function deleteApplication(id: string): Promise<FormState> {
  if (!isUuid(id)) return { ok: false, error: "Unknown application." };
  const supabase = await createClient();
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete the application." };
  revalidateApp();
  return { ok: true, error: null, savedAt: Date.now() };
}
