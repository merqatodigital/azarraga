import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/quotes/new")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/quotes" });
  },
});
