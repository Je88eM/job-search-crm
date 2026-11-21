"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Mail, MessageSquare, Phone, StickyNote, Trash2, Video, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/app/native-select";
import { deleteActivity, logActivity } from "@/app/(app)/activities/actions";
import { formatTimestamp } from "@/lib/dates";
import { ACTIVITY_LABELS, ACTIVITY_TYPES, initialFormState, type ActivityRow, type ActivityType } from "@/lib/types";

const ICONS: Record<ActivityType, LucideIcon> = {
  email: Mail,
  call: Phone,
  linkedin: MessageSquare,
  interview: Video,
  note: StickyNote,
};

type Subject = { companyId?: string; contactId?: string; applicationId?: string };

// Timeline of touchpoints for one record, newest first, with a quick "log activity" form on top.
export function ActivityTimeline({
  activities,
  subject,
  today,
}: {
  activities: ActivityRow[];
  subject: Subject;
  today: string;
}) {
  const sorted = [...activities].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));

  return (
    <section className="flex flex-col gap-3 border-t pt-4">
      <h3 className="text-sm font-medium">Activity ({activities.length})</h3>
      <LogActivityForm subject={subject} today={today} />
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet. Log your first email, call or interview above.</p>
      ) : (
        <ol className="relative flex flex-col gap-4 border-l pl-5">
          {sorted.map((a) => (
            <TimelineItem key={a.id} activity={a} subject={subject} />
          ))}
        </ol>
      )}
    </section>
  );
}

function LogActivityForm({ subject, today }: { subject: Subject; today: string }) {
  const [state, formAction, pending] = useActionState(logActivity, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.savedAt) {
      toast.success("Activity logged");
      formRef.current?.reset();
    }
  }, [state.savedAt, state.ok]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2 rounded-lg bg-muted/40 p-3">
      {subject.companyId && <input type="hidden" name="company_id" value={subject.companyId} />}
      {subject.contactId && <input type="hidden" name="contact_id" value={subject.contactId} />}
      {subject.applicationId && <input type="hidden" name="application_id" value={subject.applicationId} />}
      <div className="grid grid-cols-2 gap-2">
        <NativeSelect name="activity_type" defaultValue="email" aria-label="Activity type" className="bg-background">
          {ACTIVITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {ACTIVITY_LABELS[t]}
            </option>
          ))}
        </NativeSelect>
        <Input name="date" type="date" defaultValue={today} max={today} aria-label="Date" className="bg-background" />
      </div>
      <Textarea name="body" rows={2} required maxLength={5000} placeholder="What happened? e.g. Sent intro email to the recruiter" aria-label="What happened" className="bg-background" />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="sm" variant="secondary" disabled={pending} className="self-end">
        {pending ? "Logging..." : "Log activity"}
      </Button>
    </form>
  );
}

function TimelineItem({ activity, subject }: { activity: ActivityRow; subject: Subject }) {
  const [deleting, startDelete] = useTransition();
  const Icon = ICONS[activity.activity_type];

  // Show links to the other records this activity belongs to (not the one whose panel we're in).
  const links = [
    activity.company && !subject.companyId && { href: `/companies?open=${activity.company.id}`, label: activity.company.name },
    activity.contact && !subject.contactId && { href: `/contacts?open=${activity.contact.id}`, label: activity.contact.full_name },
    activity.application && !subject.applicationId && { href: `/applications?open=${activity.application.id}`, label: activity.application.role_title },
  ].filter(Boolean) as { href: string; label: string }[];

  function handleDelete() {
    if (!confirm("Delete this activity?")) return;
    startDelete(async () => {
      const result = await deleteActivity(activity.id);
      if (!result.ok) toast.error(result.error);
    });
  }

  return (
    <li className={cn("group", deleting && "opacity-50")}>
      <span className="absolute -left-3 flex size-6 items-center justify-center rounded-full border bg-background">
        <Icon className="size-3 text-muted-foreground" />
      </span>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{ACTIVITY_LABELS[activity.activity_type]}</span> · {formatTimestamp(activity.occurred_at)}
        </p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete activity"
          title="Delete activity"
          className="flex items-center gap-1 rounded px-1 text-xs text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:text-muted-foreground focus-visible:text-destructive"
        >
          <Trash2 className="size-3.5" />
          Delete
        </button>
      </div>
      <p className="mt-0.5 whitespace-pre-wrap text-sm">{activity.body}</p>
      {links.length > 0 && (
        <p className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-foreground hover:underline">
              {l.label}
            </Link>
          ))}
        </p>
      )}
    </li>
  );
}
