// Shared Supabase select strings, so every page loads related records the same way.
export const TASK_SELECT =
  "*, company:companies(id, name), contact:contacts(id, full_name), application:applications(id, role_title)";

/** Embedded activities for a company, contact or application side panel. */
export const ACTIVITIES_EMBED =
  "activities(id, activity_type, body, occurred_at, company:companies(id, name), contact:contacts(id, full_name), application:applications(id, role_title))";
