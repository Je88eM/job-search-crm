"use server";

import { revalidateApp } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/dates";
import { isUuid, oneOf, text, uuid } from "@/lib/form-utils";
import { ACTIVITY_TYPES, type FormState } from "@/lib/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Logs an activity (email, call, interview...) against a company, contact and/or application.
// Missing links are filled in from the records given, so one entry shows on every related timeline:
// an application brings its company and main contact; a contact brings its company.
export async function logActivity(_prev: FormState, formData: FormData): Promise<FormState> {
  const body = text(formData, "body", 5000);
  if (!body) return { ok: false, error: "Write a short note about what happened." };

  const date = text(formData, "date", 10);
  if (date && !DATE.test(date)) return { ok: false, error: "That date isn't valid." };

  let companyId = uuid(formData, "company_id");
  let contactId = uuid(formData, "contact_id");
  const applicationId = uuid(formData, "application_id");
  if (!companyId && !contactId && !applicationId) return { ok: false, error: "Nothing to log this against." };

  const supabase = await createClient();
  const today = todayISO();

  if (applicationId) {
    const { data } = await supabase
      .from("applications")
      .select("company_id, primary_contact_id")
      .eq("id", applicationId)
      .maybeSingle();
    companyId ??= data?.company_id ?? null;
    contactId ??= data?.primary_contact_id ?? null;
  }
  if (contactId && !companyId) {
    const { data } = await supabase.from("contacts").select("company_id").eq("id", contactId).maybeSingle();
    companyId = data?.company_id ?? null;
  }

  // Today keeps the exact time (so the timeline orders correctly); past dates are logged at midday Pacific.
  const occurredAt = !date || date === today ? new Date().toISOString() : new Date(`${date}T12:00:00-08:00`).toISOString();

  const { error } = await supabase.from("activities").insert({
    activity_type: oneOf(formData, "activity_type", ACTIVITY_TYPES, "note"),
    body,
    occurred_at: occurredAt,
    company_id: companyId,
    contact_id: contactId,
    application_id: applicationId,
  });

  if (error) return { ok: false, error: "Couldn't log the activity. Please try again." };

  revalidateApp();
  return { ok: true, error: null, savedAt: Date.now() };
}

export async function deleteActivity(id: string): Promise<FormState> {
  if (!isUuid(id)) return { ok: false, error: "Unknown activity." };
  const supabase = await createClient();
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete the activity." };
  revalidateApp();
  return { ok: true, error: null, savedAt: Date.now() };
}
