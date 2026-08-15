import { createMiddleware } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";

// Admin auth guard: checks for a valid Supabase session.
// If no session, redirect to /login.
// This is a client-side guard; server functions should also validate.
export const requireAdminAuth = createMiddleware().client(async ({ next }) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw redirect({ to: "/login" });
  }

  return next();
});
