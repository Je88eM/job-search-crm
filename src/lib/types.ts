// Shapes of the database rows (see supabase/migrations) and the labels shown in the UI.

export type Priority = "high" | "medium" | "low";
export type ContactType = "recruiter" | "hiring_manager" | "referral" | "other";

export type Company = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  size: string | null;
  location: string | null;
  priority: Priority;
  notes: string | null;
  created_at: string;
};

export type Contact = {
  id: string;
  company_id: string | null;
  full_name: string;
  title: string | null;
  contact_type: ContactType;
  email: string | null;
  linkedin_url: string | null;
  notes: string | null;
  created_at: string;
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  recruiter: "Recruiter",
  hiring_manager: "Hiring manager",
  referral: "Referral",
  other: "Other",
};

export type FormState = { ok: boolean; error: string | null; savedAt?: number };
export const initialFormState: FormState = { ok: false, error: null };

export type Stage = "researching" | "applied" | "interviewing" | "offer" | "rejected" | "closed";

export const STAGES: readonly Stage[] = ["researching", "applied", "interviewing", "offer", "rejected", "closed"];

export const STAGE_LABELS: Record<Stage, string> = {
  researching: "Researching",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  closed: "Closed",
};

export type Application = {
  id: string;
  company_id: string;
  primary_contact_id: string | null;
  role_title: string;
  job_url: string | null;
  stage: Stage;
  board_position: number;
  applied_on: string | null;
  salary_range: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Task = {
  id: string;
  title: string;
  due_date: string | null;
  done: boolean;
  company_id: string | null;
  contact_id: string | null;
  application_id: string | null;
  auto_generated: boolean;
  created_at: string;
};

export type TaskRow = Task & {
  company: { id: string; name: string } | null;
  contact: { id: string; full_name: string } | null;
  application: { id: string; role_title: string } | null;
};

export type ActivityType = "email" | "call" | "linkedin" | "interview" | "note";

export const ACTIVITY_TYPES: readonly ActivityType[] = ["email", "call", "linkedin", "interview", "note"];

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  email: "Email",
  call: "Call",
  linkedin: "LinkedIn",
  interview: "Interview",
  note: "Note",
};

export type ActivityRow = {
  id: string;
  activity_type: ActivityType;
  body: string;
  occurred_at: string;
  company: { id: string; name: string } | null;
  contact: { id: string; full_name: string } | null;
  application: { id: string; role_title: string } | null;
};
