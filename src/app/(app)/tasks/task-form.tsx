"use client";

import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/app/field";
import { NativeSelect } from "@/components/app/native-select";
import { initialFormState, type Task } from "@/lib/types";
import { deleteTask, saveTask } from "./actions";

export type LinkOptions = {
  companies: { id: string; name: string }[];
  contacts: { id: string; full_name: string }[];
  applications: { id: string; role_title: string; company: { name: string } | null }[];
};

export function TaskForm({ task, options, defaultDue, onDone }: { task: Task | null; options: LinkOptions; defaultDue: string; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(saveTask, initialFormState);
  const [deleting, startDelete] = useTransition();

  useEffect(() => {
    if (state.ok && state.savedAt) {
      toast.success(task ? "Task updated" : "Task added");
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.savedAt]);

  function handleDelete() {
    if (!task) return;
    if (!confirm(`Delete the task "${task.title}"?`)) return;
    startDelete(async () => {
      const result = await deleteTask(task.id);
      if (result.ok) {
        toast.success("Task deleted");
        onDone();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {task && <input type="hidden" name="id" value={task.id} />}
      <Field label="Task *" htmlFor="title">
        <Input id="title" name="title" defaultValue={task?.title} required maxLength={300} autoFocus placeholder="e.g. Send thank-you note" />
      </Field>
      <Field label="Due date" htmlFor="due_date">
        <Input id="due_date" name="due_date" type="date" defaultValue={task ? task.due_date ?? "" : defaultDue} />
      </Field>
      <Field label="Company" htmlFor="company_id">
        <NativeSelect id="company_id" name="company_id" defaultValue={task?.company_id ?? ""}>
          <option value="">None</option>
          {options.companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Contact" htmlFor="contact_id">
        <NativeSelect id="contact_id" name="contact_id" defaultValue={task?.contact_id ?? ""}>
          <option value="">None</option>
          {options.contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field label="Application" htmlFor="application_id">
        <NativeSelect id="application_id" name="application_id" defaultValue={task?.application_id ?? ""}>
          <option value="">None</option>
          {options.applications.map((a) => (
            <option key={a.id} value={a.id}>
              {a.role_title}
              {a.company ? ` (${a.company.name})` : ""}
            </option>
          ))}
        </NativeSelect>
      </Field>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={pending || deleting}>
          {pending ? "Saving..." : task ? "Save changes" : "Add task"}
        </Button>
        {task && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending || deleting} className="ml-auto">
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
    </form>
  );
}
