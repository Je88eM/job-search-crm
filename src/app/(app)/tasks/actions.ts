"use server";

import { revalidateApp } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import { isUuid, text, uuid } from "@/lib/form-utils";
import type { FormState } from "@/lib/types";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Creates a task, or updates it when the form includes an id.
export async function saveTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const title = text(formData, "title", 300);
  if (!title) return { ok: false, error: "Task title is required." };

  const dueDate = text(formData, "due_date", 10);
  if (dueDate && !DATE.test(dueDate)) return { ok: false, error: "Due date isn't a valid date." };

  const fields = {
    title,
    due_date: dueDate,
    company_id: uuid(formData, "company_id"),
    contact_id: uuid(formData, "contact_id"),
    application_id: uuid(formData, "application_id"),
  };

  const supabase = await createClient();
  const id = uuid(formData, "id");
  const { error } = id
    ? await supabase.from("tasks").update(fields).eq("id", id)
    : await supabase.from("tasks").insert(fields);

  if (error) return { ok: false, error: "Couldn't save the task. Please try again." };

  revalidateApp();
  return { ok: true, error: null, savedAt: Date.now() };
}

export async function setTaskDone(id: string, done: boolean): Promise<FormState> {
  if (!isUuid(id)) return { ok: false, error: "Unknown task." };
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ done: Boolean(done) }).eq("id", id);
  if (error) return { ok: false, error: "Couldn't update the task." };
  revalidateApp();
  return { ok: true, error: null, savedAt: Date.now() };
}

export async function deleteTask(id: string): Promise<FormState> {
  if (!isUuid(id)) return { ok: false, error: "Unknown task." };
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { ok: false, error: "Couldn't delete the task." };
  revalidateApp();
  return { ok: true, error: null, savedAt: Date.now() };
}
