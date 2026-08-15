import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login/")({
  component: LoginPage,
});

function LoginPage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = "/admin";
      }
      setChecking(false);
    };
    check();
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-900 text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18M15 3v18" />
              </svg>
            </div>
            <h1 className="mt-3 text-lg font-semibold">Azarraga Admin</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue</p>
          </div>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                supabase.auth.signInWithOAuth({
                  provider: "github",
                  options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                  },
                });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99 1.2-.945 1.845-1.305 1.845-2.235 0-.285-.015-.57-.015-.855 0-3.015 3.435-5.295 8.205-5.73 4.77-1.02 6.21-.57 6.21-1.41 0-.57-.225-1.02-.675-1.23C18.565 5.7 18.235 5.25 18.235 5.25c-.345-.135-.6-.27-.6-.27-.42-.21-.42-.615-.42-.615l.57-.015L12 2.15c.57-.12.96-.345 1.23-.615.27-.27.405-.6.405-.945C13.995 1.47 13.045.9 12.09.435c-.945-.435-1.89-.675-2.835-.675z"/>
              </svg>
              Continue with GitHub
            </button>
          </div>

          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-xs text-gray-600">
            <p className="font-medium">Admin access required.</p>
            <p className="mt-1">
              This admin portal is protected by Supabase Auth. If you need access, contact David to provision your administrator account.
            </p>
            <p className="mt-2">
              After sign-in, you will be redirected back here. If you don't have a Supabase account linked yet, David will need to set one up for you.
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Azarraga Glass & Aluminum — Admin Portal
        </p>
      </div>
    </div>
  );
}
