export const AZARRAGA_MARKETS = ["Puerto Princesa", "El Nido", "San Vicente", "Port Barton", "Roxas"] as const;

export const PRODUCT_FAMILIES = [
  "900 Series sliding systems",
  "Pocket sliding systems",
  "Frameless swing doors",
  "Shower enclosures",
  "Jalousie / Jalouplus",
  "Fixed glass",
  "Awning / casement windows",
  "Bi-fold doors",
  "Slide-up systems",
  "Mullion systems",
  "Glass railings",
  "Canopies",
  "Storefront systems",
  "ACP",
  "Roll-up doors",
  "Screen doors",
  "Tabletop / shelves",
  "Aquarium glass",
] as const;

export type EvidenceStatus = "verified" | "likely" | "needs_owner_confirmation" | "outdated" | "conflicting" | "unknown";
export type PriceKind = "historical_selling" | "current_input_cost" | "current_selling";
export type QuoteStage = "budget_estimate" | "preliminary" | "site_verified" | "final_commercial";

export interface CommercialEvidence {
  source: string;
  sourceType: "purchase_order" | "quotation" | "invoice" | "supplier_quote" | "architectural_plan" | "site_measurement" | "owner_rule" | "market_research";
  date?: string;
  status: EvidenceStatus;
  historical: boolean;
}

export interface OpeningInput {
  mark?: string;
  productFamily: string;
  widthMm?: number;
  heightMm?: number;
  quantity: number;
  configuration?: string;
  glassType?: string;
  glassThicknessMm?: number;
  frameSystem?: string;
  frameFinish?: string;
  hardware?: string[];
  exterior?: boolean;
  floorLevel?: number;
}

export function calculateGlassAreaM2(opening: OpeningInput): number | null {
  if (!opening.widthMm || !opening.heightMm || opening.quantity < 1) return null;
  return (opening.widthMm / 1000) * (opening.heightMm / 1000) * opening.quantity;
}

export function quoteReadiness(opening: OpeningInput) {
  const missing: string[] = [];
  if (!opening.productFamily) missing.push("product family");
  if (!opening.widthMm) missing.push("width");
  if (!opening.heightMm) missing.push("height");
  if (!opening.configuration) missing.push("configuration");
  if (!opening.glassType) missing.push("glass type");
  if (!opening.frameSystem && !opening.productFamily.toLowerCase().includes("frameless")) missing.push("frame/system");

  const technicalReview = Boolean(
    opening.exterior &&
    ((opening.widthMm ?? 0) >= 2400 || (opening.heightMm ?? 0) >= 2400 || (opening.floorLevel ?? 1) >= 2)
  );

  return { readyForPricing: missing.length === 0, missing, technicalReview };
}
