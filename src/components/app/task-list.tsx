"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { setTaskDone } from "@/app/(app)/tasks/actions";
import { relativeDue } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { TaskRow } from "@/lib/types";

// A checklist of tasks. Ticking a box saves instantly (optimistic) and reverts if the save fails.
// With onOpen, clicking a task calls it (Tasks tab); without, the title links to the Tasks tab.
export function TaskList({
  tasks,
  today,
  onOpen,
  emptyText = "Nothing here.",
}: {
  tasks: TaskRow[];
  today: string;
  onOpen?: (id: string) => void;
  emptyText?: string;
}) {
  const [, startTransition] = useTransition();
  const [items, applyDone] = useOptimistic(tasks, (state, change: { id: string; done: boolean }) =>
    state.map((t) => (t.id === change.id ? { ...t, done: change.done } : t)),
  );

  function toggle(task: TaskRow, done: boolean) {
    startTransition(async () => {
      applyDone({ id: task.id, done });
      const result = await setTaskDone(task.id, done);
      if (!result.ok) toast.error(result.error);
      else if (done) toast.success("Task done", { description: task.title });
    });
  }

  if (items.length === 0) {
    return <p className="py-3 text-sm text-muted-foreground">{emptyText}</p>;
  }

  return (
    <ul className="divide-y">
      {items.map((task) => {
        const overdue = !task.done && task.due_date !== null && task.due_date < today;
        return (
          <li key={task.id} className="flex items-start gap-3 py-2.5">
            <Checkbox
              checked={task.done}
              onCheckedChange={(checked) => toggle(task, Boolean(checked))}
              aria-label={task.done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              {onOpen ? (
                <button
                  type="button"
                  onClick={() => onOpen(task.id)}
                  className={cn("text-left text-sm hover:underline", task.done && "text-muted-foreground line-through")}
                >
                  {task.title}
                </button>
              ) : (
                <Link
                  href={`/tasks?open=${task.id}`}
                  className={cn("text-sm hover:underline", task.done && "text-muted-foreground line-through")}
                >
                  {task.title}
                </Link>
              )}
              <TaskLinks task={task} />
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs">
              {task.auto_generated && (
                <span title="Created automatically" className="text-muted-foreground">
                  <Sparkles className="size-3.5" />
                  <span className="sr-only">Created automatically</span>
                </span>
              )}
              {task.due_date && (
                <span className={cn("tabular-nums", overdue ? "font-medium text-red-600" : "text-muted-foreground")}>
                  {relativeDue(task.due_date, today)}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TaskLinks({ task }: { task: TaskRow }) {
  const links = [
    task.company && { href: `/companies?open=${task.company.id}`, label: task.company.name },
    task.contact && { href: `/contacts?open=${task.contact.id}`, label: task.contact.full_name },
    task.application && { href: `/applications?open=${task.application.id}`, label: task.application.role_title },
  ].filter(Boolean) as { href: string; label: string }[];

  if (links.length === 0) return null;
  return (
    <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
      {links.map((l, i) => (
        <span key={l.href}>
          {i > 0 && <span className="mr-2">·</span>}
          <Link href={l.href} className="hover:text-foreground hover:underline">
            {l.label}
          </Link>
        </span>
      ))}
    </p>
  );
}
