"use server";

import { revalidateApp } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { isUuid, oneOf, text, url, uuid } from "@/lib/form-utils";
import type { ContactType, FormState } from "@/lib/types";

const CONTACT_TYPES: readonly ContactType[] = ["recruiter", "hiring_manager", "referral", "other"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Creates a contact, or updates it when the form includes an id.
export async function saveContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const fullName = text(formData, "full_name", 200);
  if (!fullName) return { ok: false, error: "Name is required." };

  const email = text(formData, "email", 320);
  if (email && !EMAIL.test(email)) return { ok: false, error: `"${email}" doesn't look like an email address.` };

  const linkedin = url(formData, "linkedin_url");
  if (linkedin.error) return { ok: false, error: linkedin.error };

  const fields = {
    full_name: fullName,
    title: text(formData, "title", 200),
    company_id: uuid(formData, "company_id"),
    contact_type: oneOf(formData, "contact_type", CONTACT_TYPES, "other"),
    email,
    linkedin_url: linkedin.value,
    notes: text(formData, "notes", 5000),
  };

  const supabase = await createClient();
  const id = uuid(formData, "id");
  const { error } = id
    ? await supabase.from("contacts").update(fields).eq("id", id)
    : await supabase.from("contacts").insert(fields);

  if (error) return { ok: false, error: "Couldn't save the contact. Please try again." };

  revalidateApp();
  return { ok: true, error: null, savedAt: Date.now() };
}

export async function deleteContact(id: string): Promise<FormState> {
  if (!isUuid(id)) return { ok: false, error: "Unknown contact." };
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete the contact." };
  revalidateApp();
  return { ok: true, error: null, savedAt: Date.now() };
}
