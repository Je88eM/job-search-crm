"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import { STAGE_DOT } from "@/components/app/badges";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dates";
import { STAGES, STAGE_LABELS, type Stage } from "@/lib/types";
import { moveApplication } from "./actions";
import type { ApplicationRow } from "./applications-view";

type Move = { id: string; stage: Stage };

// Kanban board: one column per stage. Dragging a card to another column saves the new stage.
// The card moves instantly (optimistic update) and snaps back if the save fails.
export function Board({ applications, onOpen }: { applications: ApplicationRow[]; onOpen: (id: string) => void }) {
  const [, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [items, applyMove] = useOptimistic(applications, (state, move: Move) =>
    state.map((a) => (a.id === move.id ? { ...a, stage: move.stage, board_position: Number.MAX_SAFE_INTEGER } : a)),
  );

  const sensors = useSensors(
    // A real drag needs 5px of movement, so a plain click still opens the side panel.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const id = String(event.active.id);
    const stage = event.over?.id as Stage | undefined;
    const current = items.find((a) => a.id === id);
    if (!stage || !current || current.stage === stage) return;

    startTransition(async () => {
      applyMove({ id, stage });
      const result = await moveApplication(id, stage);
      if (!result.ok) {
        toast.error(result.error);
      } else if (stage === "applied") {
        toast.success(`Moved to Applied`, { description: "Follow-up task created for 7 days from now." });
      }
    });
  }

  const active = activeId ? items.find((a) => a.id === activeId) : null;

  return (
    <DndContext
      id="applications-board"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const cards = items
            .filter((a) => a.stage === stage)
            .sort((a, b) => a.board_position - b.board_position);
          return (
            <Column key={stage} stage={stage} count={cards.length}>
              {cards.map((a) => (
                <DraggableCard key={a.id} application={a} onOpen={onOpen} hidden={a.id === activeId} />
              ))}
            </Column>
          );
        })}
      </div>
      <DragOverlay>{active ? <Card application={active} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function Column({ stage, count, children }: { stage: Stage; count: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <section
      ref={setNodeRef}
      aria-label={`${STAGE_LABELS[stage]} column`}
      className={cn(
        "flex w-64 shrink-0 flex-col gap-2 rounded-lg bg-muted/50 p-2 transition-colors",
        isOver && "bg-muted ring-2 ring-ring/30",
      )}
    >
      <header className="flex items-center gap-2 px-1.5 py-1 text-sm font-medium">
        <span className={cn("size-2 rounded-full", STAGE_DOT[stage])} />
        {STAGE_LABELS[stage]}
        <span className="ml-auto text-xs font-normal text-muted-foreground tabular-nums">{count}</span>
      </header>
      <div className="flex min-h-24 flex-col gap-2">{children}</div>
    </section>
  );
}

function DraggableCard({ application, onOpen, hidden }: { application: ApplicationRow; onOpen: (id: string) => void; hidden: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: application.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(application.id)}
      onKeyDown={(e) => {
        // Space/Enter start a keyboard drag (dnd-kit); "o" opens the panel.
        listeners?.onKeyDown?.(e);
        if (e.key === "o") onOpen(application.id);
      }}
      className={cn("cursor-grab touch-none rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring", hidden && "opacity-30")}
    >
      <Card application={application} />
    </div>
  );
}

function Card({ application, dragging = false }: { application: ApplicationRow; dragging?: boolean }) {
  return (
    <div className={cn("rounded-md border bg-background p-3 text-sm shadow-xs", dragging && "rotate-2 shadow-lg")}>
      <p className="font-medium leading-snug">{application.role_title}</p>
      <p className="mt-0.5 text-muted-foreground">{application.company?.name}</p>
      {(application.contact || application.applied_on) && (
        <p className="mt-2 flex justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{application.contact?.full_name}</span>
          {application.applied_on && <span className="shrink-0">Applied {formatDate(application.applied_on)}</span>}
        </p>
      )}
    </div>
  );
}
