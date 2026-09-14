import { createFileRoute } from "@tanstack/react-router";
import LandingPage from "@/components/LandingPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glass & Aluminum Solutions | Azarraga Palawan" },
      { name: "description", content: "Explore custom windows, doors, glass railings, skylights, and aluminum systems by Azarraga Glass & Aluminum in Palawan." },
      { property: "og:title", content: "Glass & Aluminum Solutions | Azarraga Palawan" },
      { property: "og:description", content: "Explore custom windows, doors, glass railings, skylights, and aluminum systems by Azarraga Glass & Aluminum in Palawan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});
