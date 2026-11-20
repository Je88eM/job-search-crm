import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageBadge, STAGE_DOT } from "@/components/app/badges";
import { TaskList } from "@/components/app/task-list";
import { createClient } from "@/lib/supabase/server";
import { addDays, longToday, todayISO } from "@/lib/dates";
import { TASK_SELECT } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { STAGES, STAGE_LABELS, type Stage, type TaskRow } from "@/lib/types";

const STALE_AFTER_DAYS = 7;
const ACTIVE_STAGES: Stage[] = ["applied", "interviewing"];

type DashboardApplication = {
  id: string;
  role_title: string;
  stage: Stage;
  updated_at: string;
  company: { name: string } | null;
};

// Loads everything the dashboard needs. Connecting to Supabase first marks the page as per-request,
// so reading the clock afterwards is allowed (Next.js 16 Cache Components).
async function loadDashboard() {
  const supabase = await createClient();
  const now = Date.now();
  const today = todayISO();
  const weekAhead = addDays(today, 7);

  const [tasksResult, applicationsResult, activitiesResult] = await Promise.all([
    supabase
      .from("tasks")
      .select(TASK_SELECT)
      .eq("done", false)
      .lte("due_date", weekAhead)
      .order("due_date")
      .order("created_at"),
    supabase.from("applications").select("id, role_title, stage, updated_at, company:companies(name)"),
    supabase
      .from("activities")
      .select("application_id, occurred_at")
      .not("application_id", "is", null)
      .order("occurred_at", { ascending: false }),
  ]);
  if (tasksResult.error || applicationsResult.error || activitiesResult.error) {
    throw new Error("Couldn't load the dashboard.");
  }

  const tasks = (tasksResult.data ?? []) as TaskRow[];
  const applications = (applicationsResult.data ?? []) as unknown as DashboardApplication[];
  const countByStage = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
  for (const a of applications) countByStage[a.stage]++;

  // "Gone quiet" = applied or interviewing, with no edit or logged activity for 7+ days.
  const lastActivity = new Map<string, string>();
  for (const act of activitiesResult.data ?? []) {
    if (act.application_id && !lastActivity.has(act.application_id)) lastActivity.set(act.application_id, act.occurred_at);
  }
  const stale = applications
    .filter((a) => ACTIVE_STAGES.includes(a.stage))
    .map((a) => {
      const touched = [a.updated_at, lastActivity.get(a.id)].filter(Boolean).map((d) => Date.parse(d!));
      return { ...a, daysQuiet: Math.floor((now - Math.max(...touched)) / 86_400_000) };
    })
    .filter((a) => a.daysQuiet >= STALE_AFTER_DAYS)
    .sort((a, b) => b.daysQuiet - a.daysQuiet);

  return {
    today,
    heading: longToday(),
    overdue: tasks.filter((t) => t.due_date! < today),
    dueToday: tasks.filter((t) => t.due_date === today),
    upcoming: tasks.filter((t) => t.due_date! > today),
    countByStage,
    activeCount: applications.filter((a) => !["rejected", "closed"].includes(a.stage)).length,
    stale,
  };
}

export default async function TodayPage() {
  const { today, heading, overdue, dueToday, upcoming, countByStage, activeCount, stale } = await loadDashboard();

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Today</h1>
        <p className="mt-1 text-sm text-muted-foreground">{heading}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Active applications" value={activeCount} href="/applications" />
        <Stat label="Interviewing" value={countByStage.interviewing} href="/applications?stage=interviewing" />
        <Stat label="Offers" value={countByStage.offer} href="/applications?stage=offer" />
        <Stat label="Overdue tasks" value={overdue.length} href="/tasks?due=overdue" alert={overdue.length > 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          {overdue.length > 0 && (
            <Section title="Overdue" tone="alert">
              <TaskList tasks={overdue} today={today} />
            </Section>
          )}
          <Section title="Due today">
            <TaskList tasks={dueToday} today={today} emptyText="Nothing due today." />
          </Section>
          <Section title="Next 7 days">
            <TaskList tasks={upcoming} today={today} emptyText="Nothing scheduled this week." />
          </Section>
        </div>

        <div className="flex flex-col gap-6">
          <Section title="Pipeline">
            <ul className="flex flex-col gap-1 py-1">
              {STAGES.map((s) => (
                <li key={s}>
                  <Link href={`/applications?stage=${s}`} className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted">
                    <span className={cn("size-2 rounded-full", STAGE_DOT[s])} />
                    {STAGE_LABELS[s]}
                    <span className="ml-auto tabular-nums text-muted-foreground">{countByStage[s]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Gone quiet">
            {stale.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">No applications have gone {STALE_AFTER_DAYS}+ days without activity.</p>
            ) : (
              <ul className="flex flex-col gap-1 py-1">
                {stale.map((a) => (
                  <li key={a.id}>
                    <Link href={`/applications?open=${a.id}`} className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-sm hover:bg-muted">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{a.role_title}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {a.company?.name} · {a.daysQuiet} days quiet
                        </span>
                      </span>
                      <StageBadge stage={a.stage} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, href, alert = false }: { label: string; value: number; href: string; alert?: boolean }) {
  return (
    <Link href={href} className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card size="sm" className="transition-colors hover:bg-muted/40">
        <CardContent>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn("mt-1 text-2xl font-semibold tabular-nums", alert && "text-red-600")}>{value}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function Section({ title, tone, children }: { title: string; tone?: "alert"; children: React.ReactNode }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className={cn("text-sm", tone === "alert" && "text-red-600")}>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
