export type PalawanLead = {
  source: "openstreetmap";
  sourceId: string;
  name: string;
  category: string;
  address?: string;
  phone?: string;
  website?: string;
  latitude: number;
  longitude: number;
  area: string;
  score: number;
  reasons: string[];
};

type OsmElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

export const PALAWAN_TERRITORIES = [
  "Puerto Princesa",
  "San Vicente",
  "Port Barton",
  "El Nido",
  "Roxas",
  "Taytay",
  "Coron",
] as const;

const TARGETS = [
  { key: "tourism", value: "hotel", weight: 35 },
  { key: "tourism", value: "resort", weight: 40 },
  { key: "tourism", value: "guest_house", weight: 25 },
  { key: "tourism", value: "hostel", weight: 25 },
  { key: "office", value: "construction_company", weight: 45 },
  { key: "office", value: "architect", weight: 40 },
  { key: "office", value: "engineer", weight: 35 },
  { key: "craft", value: "builder", weight: 35 },
] as const;

function esc(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function buildOverpassQuery(area: string): string {
  const selectors = TARGETS.flatMap(({ key, value }) => [
    `node["${key}"="${value}"](area.searchArea);`,
    `way["${key}"="${value}"](area.searchArea);`,
    `relation["${key}"="${value}"](area.searchArea);`,
  ]).join("\n");
  return `[out:json][timeout:30];\narea["name"="${esc(area)}"]->.searchArea;\n(\n${selectors}\n);\nout center tags;`;
}

function category(tags: Record<string, string>): { label: string; base: number } {
  for (const target of TARGETS) {
    if (tags[target.key] === target.value) return { label: target.value.replace(/_/g, " "), base: target.weight };
  }
  return { label: "business", base: 10 };
}

function scoreLead(tags: Record<string, string>): { score: number; reasons: string[] } {
  const c = category(tags);
  let score = c.base;
  const reasons = [`Target category: ${c.label}`];
  if (tags.website || tags["contact:website"]) { score += 10; reasons.push("Has website for research"); }
  if (tags.phone || tags["contact:phone"]) { score += 10; reasons.push("Has public business phone"); }
  if (tags.email || tags["contact:email"]) { score += 10; reasons.push("Has public business email"); }
  if (tags["building:levels"] && Number(tags["building:levels"]) >= 2) { score += 10; reasons.push("Multi-level property"); }
  return { score: Math.min(score, 100), reasons };
}

function address(tags: Record<string, string>): string | undefined {
  const parts = [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean);
  return parts.length ? parts.join(" ") : undefined;
}

export function normalizeOsmLeads(elements: OsmElement[], area: string): PalawanLead[] {
  const seen = new Set<string>();
  const leads: PalawanLead[] = [];
  for (const element of elements) {
    const tags = element.tags ?? {};
    const name = tags.name?.trim();
    const latitude = element.lat ?? element.center?.lat;
    const longitude = element.lon ?? element.center?.lon;
    if (!name || latitude == null || longitude == null) continue;
    const identity = `${name.toLowerCase()}|${latitude.toFixed(4)}|${longitude.toFixed(4)}`;
    if (seen.has(identity)) continue;
    seen.add(identity);
    const scored = scoreLead(tags);
    leads.push({
      source: "openstreetmap",
      sourceId: `${element.type}/${element.id}`,
      name,
      category: category(tags).label,
      address: address(tags),
      phone: tags.phone ?? tags["contact:phone"],
      website: tags.website ?? tags["contact:website"],
      latitude,
      longitude,
      area,
      score: scored.score,
      reasons: scored.reasons,
    });
  }
  return leads.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

export async function discoverPalawanLeads(area: string, endpoint = "https://overpass-api.de/api/interpreter"): Promise<PalawanLead[]> {
  if (!PALAWAN_TERRITORIES.includes(area as (typeof PALAWAN_TERRITORIES)[number])) throw new Error(`Unsupported Palawan territory: ${area}`);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "Azarraga-TALA/1.0" },
    body: new URLSearchParams({ data: buildOverpassQuery(area) }),
  });
  if (!response.ok) throw new Error(`Lead discovery failed (${response.status})`);
  const data = (await response.json()) as { elements?: OsmElement[] };
  return normalizeOsmLeads(data.elements ?? [], area);
}
