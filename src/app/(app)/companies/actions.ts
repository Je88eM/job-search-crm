"use server";

import { revalidateApp } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { isUuid, oneOf, text, url, uuid } from "@/lib/form-utils";
import type { FormState, Priority } from "@/lib/types";

const PRIORITIES: readonly Priority[] = ["high", "medium", "low"];

// Creates a company, or updates it when the form includes an id.
// Row Level Security makes sure only the signed-in user's rows can be touched.
export async function saveCompany(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = text(formData, "name", 200);
  if (!name) return { ok: false, error: "Company name is required." };

  const website = url(formData, "website");
  if (website.error) return { ok: false, error: website.error };

  const fields = {
    name,
    website: website.value,
    industry: text(formData, "industry", 200),
    size: text(formData, "size", 100),
    location: text(formData, "location", 200),
    priority: oneOf(formData, "priority", PRIORITIES, "medium"),
    notes: text(formData, "notes", 5000),
  };

  const supabase = await createClient();
  const id = uuid(formData, "id");
  const { error } = id
    ? await supabase.from("companies").update(fields).eq("id", id)
    : await supabase.from("companies").insert(fields);

  if (error) return { ok: false, error: "Couldn't save the company. Please try again." };

  revalidateApp();
  return { ok: true, error: null, savedAt: Date.now() };
}

export async function deleteCompany(id: string): Promise<FormState> {
  if (!isUuid(id)) return { ok: false, error: "Unknown company." };
  const supabase = await createClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete the company." };
  revalidateApp();
  return { ok: true, error: null, savedAt: Date.now() };
}
