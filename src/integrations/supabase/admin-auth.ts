import { redirect } from "@tanstack/react-router";
import { supabase } from "./client";

// Admin auth guard: checks for a valid Supabase session.
// If no session, redirect to /login.
// This is a client-side guard; server functions should also validate.
export async function requireAdminAuth() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw redirect({ to: "/login" });
  }
}
