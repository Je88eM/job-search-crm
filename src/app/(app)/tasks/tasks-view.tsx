"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/components/app/page-header";
import { TaskList } from "@/components/app/task-list";
import type { TaskRow } from "@/lib/types";
import { TaskForm, type LinkOptions } from "./task-form";

export function TasksView({
  tasks,
  options,
  today,
  initialOpenId,
}: {
  tasks: TaskRow[];
  options: LinkOptions;
  today: string;
  initialOpenId: string | null;
}) {
  const [openId, setOpenId] = useState<string | null>(
    initialOpenId && tasks.some((t) => t.id === initialOpenId) ? initialOpenId : null,
  );
  const selected = openId && openId !== "new" ? tasks.find((t) => t.id === openId) ?? null : null;

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Follow-ups and to-dos. The sparkle marks tasks created automatically."
        action={
          <Button onClick={() => setOpenId("new")}>
            <Plus /> New task
          </Button>
        }
      />

      <div className="rounded-lg border px-4">
        <TaskList tasks={tasks} today={today} onOpen={setOpenId} emptyText="No tasks match. You're all caught up." />
      </div>

      <Sheet open={openId !== null} onOpenChange={(open) => !open && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selected ? "Edit task" : "New task"}</SheetTitle>
            <SheetDescription>
              {selected?.auto_generated ? "Created automatically when the application moved to Applied." : "Link it to a company, contact or application."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <TaskForm key={openId ?? "closed"} task={selected} options={options} defaultDue={today} onDone={() => setOpenId(null)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
