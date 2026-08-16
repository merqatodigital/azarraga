export type ExtractionStatus = "CONFIRMED" | "INTERPRETED" | "MISSING" | "NEEDS_HUMAN_CONFIRMATION";

export interface ProvenanceField<T> { value: T | null; status: ExtractionStatus; confidence: number; sourceSnippet: string; reason?: string; }
export interface LineItemSpecification {
  lineItemId: string; itemNumber: number; locationRoom: ProvenanceField<string>; quantity: ProvenanceField<number>;
  unit: ProvenanceField<string>; systemType: ProvenanceField<string>; widthMm: ProvenanceField<number>; heightMm: ProvenanceField<number>;
  glassType: ProvenanceField<string>; glassThicknessMm: ProvenanceField<number>; glassColor: ProvenanceField<string>;
  aluminumProfile: ProvenanceField<string>; finishColor: ProvenanceField<string>; hardware: ProvenanceField<string>;
  screens: ProvenanceField<boolean>; installationRequirement: ProvenanceField<string>; notes: ProvenanceField<string>;
}
export interface IngestionResult { clientId: string; projectId: string; rawSourceRef: string; lineItems: LineItemSpecification[]; requiresHumanReview: boolean; blockersCount: number; }

type RawItem = Record<string, unknown>;

export class TalaProductionIngestionEngine {
  constructor(private apiKey: string, private model: string) {}

  async parseRawInput(text: string, clientId: string, projectId: string): Promise<IngestionResult> {
    if (!text.trim()) throw new Error("Input document text is empty");
    const extracted = await this.extract(text);
    const lineItems = extracted.map((item, i) => this.normalize(item, i + 1));
    const blockersCount = lineItems.filter((item) => this.hasCriticalBlockers(item)).length;
    return { clientId, projectId, rawSourceRef: `text:${this.hashRef(text)}`, lineItems, requiresHumanReview: blockersCount > 0, blockersCount };
  }

  private async extract(text: string): Promise<RawItem[]> {
    if (!this.apiKey) throw new Error("OpenRouter API key is required");
    if (!this.model) throw new Error("TALA extraction model is required");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://azarraga.merqato.digital", "X-Title": "Azarraga TALA Ingestion" },
      body: JSON.stringify({
        model: this.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Extract glass/aluminum line items. Return JSON object {lineItems:[...]}. Preserve dimensions WITH their written units. Never infer missing quantity, units, dimensions, glass, aluminum, hardware, installation, or scope. Use null when absent. Preserve exact supporting text in source snippets where possible." },
          { role: "user", content: text },
        ],
      }),
    });
    const payload = await response.json().catch(() => ({})) as any;
    if (!response.ok) throw new Error(payload?.error?.message || `OpenRouter extraction failed (${response.status})`);
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("Extractor returned no JSON content");
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { throw new Error("Extractor returned invalid JSON"); }
    if (!Array.isArray(parsed?.lineItems)) throw new Error("Extractor response missing lineItems array");
    return parsed.lineItems;
  }

  private normalize(raw: RawItem, itemNumber: number): LineItemSpecification {
    return {
      lineItemId: `LI-${this.hashRef(JSON.stringify(raw))}-${itemNumber}`, itemNumber,
      locationRoom: this.interpreted(raw.location), quantity: this.quantity(raw.quantity), unit: this.interpreted(raw.unit),
      systemType: this.interpreted(raw.systemType), widthMm: this.dimension(raw.width), heightMm: this.dimension(raw.height),
      glassType: this.interpreted(raw.glassType), glassThicknessMm: this.numberField(raw.glassThickness), glassColor: this.interpreted(raw.glassColor),
      aluminumProfile: this.interpreted(raw.aluminumProfile), finishColor: this.interpreted(raw.finishColor), hardware: this.interpreted(raw.hardware),
      screens: this.booleanField(raw.screens), installationRequirement: this.interpreted(raw.installation), notes: this.interpreted(raw.notes),
    };
  }

  private dimension(value: unknown): ProvenanceField<number> {
    if (value == null || value === "") return this.missing("Dimension is missing");
    const source = String(value).trim().toLowerCase();
    if (/[?~]|\bor\b|approx|approximately/.test(source)) return this.review(source, "Ambiguous measurement; blocked from pricing");
    const m = source.match(/^([0-9]*\.?[0-9]+)\s*(m|cm|mm)$/);
    if (!m) return this.review(source, "Dimension must contain an explicit m, cm, or mm unit");
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n <= 0) return this.review(source, "Dimension must be greater than zero");
    const mm = m[2] === "m" ? n * 1000 : m[2] === "cm" ? n * 10 : n;
    return { value: mm, status: "INTERPRETED", confidence: 0.9, sourceSnippet: source, reason: `Normalized to ${mm} mm` };
  }

  private quantity(value: unknown): ProvenanceField<number> {
    if (value == null || value === "") return this.missing("Quantity is missing; pricing is blocked");
    const source = String(value).trim(); const n = Number(source);
    if (!Number.isInteger(n) || n <= 0) return this.review(source, "Quantity must be a positive whole number");
    return { value: n, status: "INTERPRETED", confidence: 0.95, sourceSnippet: source };
  }

  private numberField(value: unknown): ProvenanceField<number> {
    if (value == null || value === "") return this.missing("Value is missing");
    const source = String(value).trim(); const n = Number(source.replace(/mm$/i, "").trim());
    if (!Number.isFinite(n)) return this.review(source, "Invalid numeric value");
    return { value: n, status: "INTERPRETED", confidence: 0.85, sourceSnippet: source };
  }

  private booleanField(value: unknown): ProvenanceField<boolean> {
    if (value == null || value === "") return this.missing("Screen requirement not stated");
    if (typeof value === "boolean") return { value, status: "INTERPRETED", confidence: 0.85, sourceSnippet: String(value) };
    const s = String(value).toLowerCase();
    if (["yes","true","with screen"].includes(s)) return { value: true, status: "INTERPRETED", confidence: 0.8, sourceSnippet: String(value) };
    if (["no","false","without screen"].includes(s)) return { value: false, status: "INTERPRETED", confidence: 0.8, sourceSnippet: String(value) };
    return this.review(String(value), "Screen requirement is ambiguous");
  }

  private interpreted(value: unknown): ProvenanceField<string> {
    if (value == null || value === "") return this.missing("Value is missing");
    return { value: String(value), status: "INTERPRETED", confidence: 0.8, sourceSnippet: String(value), reason: "LLM extracted; not human-confirmed" };
  }
  private missing<T>(reason: string): ProvenanceField<T> { return { value: null, status: "MISSING", confidence: 0, sourceSnippet: "", reason }; }
  private review<T>(sourceSnippet: string, reason: string): ProvenanceField<T> { return { value: null, status: "NEEDS_HUMAN_CONFIRMATION", confidence: 0.2, sourceSnippet, reason }; }
  private hasCriticalBlockers(i: LineItemSpecification): boolean {
    const critical = [i.quantity, i.widthMm, i.heightMm, i.systemType, i.glassType];
    return critical.some((f) => f.status === "MISSING" || f.status === "NEEDS_HUMAN_CONFIRMATION");
  }
  private hashRef(text: string): string { let h = 2166136261; for (let i=0;i<text.length;i++) { h ^= text.charCodeAt(i); h = Math.imul(h,16777619); } return (h>>>0).toString(16); }
}
