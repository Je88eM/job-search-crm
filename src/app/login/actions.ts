"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Wrong email and wrong password get the same message, so the page doesn't reveal which emails exist.
    if (error.code === "invalid_credentials") {
      return { error: "That email and password don't match." };
    }
    // Anything else is a setup or network problem (e.g. a bad key in the hosting settings), not the user's typing.
    console.error("Login failed:", error.code ?? error.status, error.message);
    return { error: "Login isn't available right now (setup problem). Please try again later." };
  }

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
