// Security check: proves Row Level Security keeps each user's data private.
// Run from the project folder:  node tools/rls_check.mjs
//
// Reads from .env.local (never printed):
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, DEMO_EMAIL, DEMO_PASSWORD
// The demo account must hold only the demo data (supabase/seed.sql), and your own account
// should have at least one row in each table, so "can't see other users' rows" is a real test.
// Changes nothing that passes: every write attempt below is expected to be blocked.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^([A-Z_]+)=(.*)$/))
    .filter(Boolean)
    .map(([, key, value]) => [key, value.trim()]),
);

for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "DEMO_EMAIL", "DEMO_PASSWORD"]) {
  if (!env[key]) {
    console.error(`Missing ${key} in .env.local`);
    process.exit(1);
  }
}

const TABLES = ["companies", "contacts", "applications", "tasks", "activities"];
const results = [];
const check = (name, passed, detail = "") => results.push({ name, passed, detail });
const options = { auth: { persistSession: false, autoRefreshToken: false } };

// ---------- 1. Logged-out visitor ----------
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);

for (const table of TABLES) {
  const { data, error } = await anon.from(table).select("id").limit(1);
  check(`Logged out: cannot read ${table}`, Boolean(error) || data.length === 0, error?.code ?? `${data.length} rows`);
}
{
  const { error } = await anon.from("companies").insert({ name: "RLS test (should be blocked)" });
  check("Logged out: cannot insert a company", Boolean(error), error?.code ?? "insert succeeded!");
}
{
  const { error } = await anon.auth.signUp({ email: "rls-signup-test@example.com", password: "Test-only-password-123!" });
  check("Strangers cannot sign up", error?.code === "signup_disabled", error?.code ?? "sign-up allowed!");
}

// ---------- 2. Signed in as the demo user ----------
const demo = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
const { data: login, error: loginError } = await demo.auth.signInWithPassword({
  email: env.DEMO_EMAIL,
  password: env.DEMO_PASSWORD,
});
if (loginError) {
  console.error(`Demo login failed (${loginError.code ?? loginError.message}). Check DEMO_EMAIL / DEMO_PASSWORD.`);
  process.exit(1);
}
const demoId = login.user.id;

for (const table of TABLES) {
  const { data, error } = await demo.from(table).select("id, user_id");
  const others = (data ?? []).filter((row) => row.user_id !== demoId).length;
  check(`Demo user sees only own ${table}`, !error && others === 0, error?.code ?? `${data.length} own rows, ${others} other users' rows`);
}

for (const table of TABLES) {
  const column = { companies: "notes", contacts: "notes", applications: "notes", tasks: "title", activities: "body" }[table];
  const { data, error } = await demo.from(table).update({ [column]: "RLS test" }).neq("user_id", demoId).select("id");
  check(`Demo user cannot edit others' ${table}`, Boolean(error) || data.length === 0, error?.code ?? `${data.length} rows changed`);
}

for (const table of TABLES) {
  const { data, error } = await demo.from(table).delete().neq("user_id", demoId).select("id");
  check(`Demo user cannot delete others' ${table}`, Boolean(error) || data.length === 0, error?.code ?? `${data.length} rows deleted`);
}

{
  const fakeOwner = "00000000-0000-4000-8000-000000000000";
  const { error } = await demo.from("companies").insert({ name: "RLS test (should be blocked)", user_id: fakeOwner });
  check("Demo user cannot create rows owned by someone else", Boolean(error), error?.code ?? "insert succeeded!");
}

await demo.auth.signOut();

// ---------- Report ----------
const failed = results.filter((r) => !r.passed);
for (const r of results) console.log(`${r.passed ? "PASS" : "FAIL"}  ${r.name}  (${r.detail})`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
process.exit(failed.length ? 1 : 0);
