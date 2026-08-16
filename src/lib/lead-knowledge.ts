// ── Azarraga Glass & Aluminum — Lead Knowledge ─────────────────────────────
//
// Lead schema, qualification model, scoring, and conversion types.
// This is the BUSINESS KNOWLEDGE layer — not the agent runtime.

// ──────────────────────────────────────────────────────────────────────────────
// 1. CUSTOMER TYPES
// ──────────────────────────────────────────────────────────────────────────────

export const CUSTOMER_TYPES = {
  general_contractor: {
    name: "General Contractor",
    label: "General Contractor",
    description: "Main contractor managing construction projects.",
    typical_volume: "Medium to large",
    typical_project_types: ["Residential renovation", "Commercial build-out", "Multi-unit residential", "Gut rehab"],
    lead_signals: ["contractor awarded", "active project", "new construction"],
  },
  developer: {
    name: "Developer",
    label: "Developer",
    description: "Property developer building residential or commercial developments.",
    typical_volume: "Large",
    typical_project_types: ["Condo developments", "Subdivisions", "Commercial developments", "Mixed-use"],
    lead_signals: ["new construction", "resort development", "active project"],
  },
  resort: {
    name: "Resort",
    label: "Resort",
    description: "Resort/hotel operator. High-end or mid-scale. Often needs premium systems and recurring work.",
    typical_volume: "Large to very large",
    typical_project_types: ["New resort construction", "Resort expansion", "Room refurbishment", "Pool/bar area glazing", "Facade upgrades"],
    lead_signals: ["resort development", "expansion", "new rooms", "renovation", "active project"],
  },
  hotel: {
    name: "Hotel",
    label: "Hotel",
    description: "Hotel operator (independent or chain).",
    typical_volume: "Medium to large",
    typical_project_types: ["Room upgrades", "Lobby/entry glazing", "Pool/deck areas", "Branding facade"],
    lead_signals: ["hotel development", "renovation", "new rooms", "expansion"],
  },
  architect: {
    name: "Architect",
    label: "Architect",
    description: "Architect specifying glass/aluminum systems.",
    typical_volume: "Varies",
    typical_project_types: ["Residential", "Commercial", "Resorts", "Government buildings"],
    lead_signals: ["new construction", "active project"],
  },
  engineer: {
    name: "Engineer",
    label: "Engineer",
    description: "Structural or MEP engineer specifying structural glass or aluminum.",
    typical_volume: "Varies",
    typical_project_types: ["Structural glass", "Heavy-duty glazing", "Commercial facades"],
    lead_signals: ["new construction", "active project"],
  },
  commercial_construction: {
    name: "Commercial Construction",
    label: "Commercial Construction",
    description: "Commercial construction projects: offices, retail, mixed-use.",
    typical_volume: "Medium to large",
    typical_project_types: ["Office buildings", "Retail centers", "Mixed-use", "Commercial renovation"],
    lead_signals: ["new construction", "active project", "commercial construction"],
  },
  residential_construction: {
    name: "Residential Construction",
    label: "Residential Construction",
    description: "Residential projects: new homes, renovation, condo units.",
    typical_volume: "Small to medium",
    typical_project_types: ["New home construction", "Renovation", "Condo unit fit-out", "House extension"],
    lead_signals: ["new construction", "renovation", "active project"],
  },
} as const;

export type CustomerTypeKey = keyof typeof CUSTOMER_TYPES;

// ──────────────────────────────────────────────────────────────────────────────
// 2. GEOGRAPHY
// ──────────────────────────────────────────────────────────────────────────────

export const PALAWAN_LOCATIONS = [
  "Puerto Princesa",
  "El Nido",
  "San Vicente",
  "Port Barton",
] as const;

export type PalawanLocation = (typeof PALAWAN_LOCATIONS)[number];

// ──────────────────────────────────────────────────────────────────────────────
// 3. LEAD SIGNALS
// ──────────────────────────────────────────────────────────────────────────────

export const LEAD_SIGNALS = {
  new_construction:       { label: "New construction",        weight: 5 },
  resort_development:     { label: "Resort development",      weight: 7 },
  hotel_development:      { label: "Hotel development",       weight: 6 },
  expansion:              { label: "Expansion",               weight: 4 },
  renovation:             { label: "Renovation",              weight: 3 },
  new_rooms:              { label: "New rooms",               weight: 3 },
  glass:                  { label: "Glass inquiry",           weight: 3 },
  windows:                { label: "Windows inquiry",         weight: 3 },
  doors:                  { label: "Doors inquiry",           weight: 3 },
  facade:                 { label: "Facade inquiry",          weight: 4 },
  aluminum:               { label: "Aluminum inquiry",        weight: 3 },
  contractor_awarded:     { label: "Contractor awarded project", weight: 5 },
  active_project:         { label: "Active project",          weight: 4 },
} as const;

export type LeadSignalKey = keyof typeof LEAD_SIGNALS;

// ──────────────────────────────────────────────────────────────────────────────
// 4. LEAD STAGES
// ──────────────────────────────────────────────────────────────────────────────

export const LEAD_STAGE = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  PROPOSING: "proposing",
  NEGOTIATING: "negotiating",
  CONVERTED: "converted",
  LOST: "lost",
  STALLED: "stalled",
} as const;

export type LeadStageKey = (typeof LEAD_STAGE)[keyof typeof LEAD_STAGE];

// ──────────────────────────────────────────────────────────────────────────────
// 5. LEAD ROW TYPE
// ──────────────────────────────────────────────────────────────────────────────

export interface LeadRow {
  id: string;
  lead_reference: string;
  source: string;
  source_url: string | null;
  customer_type: string;
  customer_type_label: string;
  company_name: string | null;
  contact_name: string;
  contact_role: string | null;
  phone: string | null;
  email: string | null;
  project_name: string | null;
  project_description: string | null;
  project_location: string | null;
  estimated_start_date: string | null;
  estimated_completion_date: string | null;
  budget_range: string | null;
  project_type: string | null;
  signals: string[] | null;
  stage: string;
  score: number;
  notes: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: string;
  description: string;
  occurred_at: string;
  by: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// 6. DETERMINISTIC SCORING
// ──────────────────────────────────────────────────────────────────────────────

export function scoreLead(
  signals: LeadSignalKey[],
  customerType: CustomerTypeKey,
  location: string,
  hasBudget: boolean,
  hasTimeline: boolean,
  hasProjectDetails: boolean,
): number {
  let score = 0;

  for (const signal of signals) {
    const s = LEAD_SIGNALS[signal];
    if (s) score += s.weight;
  }

  const typeWeights: Record<string, number> = {
    resort: 5,
    developer: 5,
    hotel: 4,
    general_contractor: 3,
    commercial_construction: 3,
    architect: 2,
    engineer: 2,
    residential_construction: 2,
  };
  score += typeWeights[customerType] ?? 0;

  if (hasBudget) score += 3;
  if (hasTimeline) score += 2;
  if (hasProjectDetails) score += 2;

  if (PALAWAN_LOCATIONS.includes(location as PalawanLocation)) {
    score += 2;
  }

  return score;
}
