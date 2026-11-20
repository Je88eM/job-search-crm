import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CONTACT_TYPE_LABELS, PRIORITY_LABELS, STAGE_LABELS, type ContactType, type Priority, type Stage } from "@/lib/types";

const PRIORITY_STYLES: Record<Priority, string> = {
  high: "border-red-200 bg-red-50 text-red-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  low: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={cn(PRIORITY_STYLES[priority])}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}

const CONTACT_TYPE_STYLES: Record<ContactType, string> = {
  recruiter: "border-sky-200 bg-sky-50 text-sky-700",
  hiring_manager: "border-violet-200 bg-violet-50 text-violet-700",
  referral: "border-emerald-200 bg-emerald-50 text-emerald-700",
  other: "border-zinc-200 bg-zinc-50 text-zinc-600",
};

export function ContactTypeBadge({ type }: { type: ContactType }) {
  return (
    <Badge variant="outline" className={cn(CONTACT_TYPE_STYLES[type])}>
      {CONTACT_TYPE_LABELS[type]}
    </Badge>
  );
}

export const STAGE_DOT: Record<Stage, string> = {
  researching: "bg-zinc-400",
  applied: "bg-sky-500",
  interviewing: "bg-violet-500",
  offer: "bg-emerald-500",
  rejected: "bg-red-400",
  closed: "bg-zinc-300",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className={cn("size-1.5 rounded-full", STAGE_DOT[stage])} />
      {STAGE_LABELS[stage]}
    </Badge>
  );
}
