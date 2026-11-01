import { createFileRoute } from "@tanstack/react-router";
import LandingPage from "@/components/LandingPage";
import { getSiteContent } from "@/lib/site-content.functions";

export const Route = createFileRoute("/")({
  loader: async () => {
    try {
      const { data } = await getSiteContent();
      return { siteContent: data };
    } catch (error) {
      console.error("Could not preload website CMS content:", error);
      return { siteContent: null };
    }
  },
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
  component: LandingPageRoute,
});

function LandingPageRoute() {
  const { siteContent } = Route.useLoaderData();
  return <LandingPage initialSiteContent={siteContent} />;
}
