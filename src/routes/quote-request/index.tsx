// ── Azarraga Glass & Aluminum — Public Quote Request ──────────────────────
//
// Public lead capture form. Submits to the lead system.
// Optional document upload: clients can attach their PO, quotation,
// sketch, or photo when requesting a quote.
//
// No admin functionality exposed. No Supabase keys in the browser bundle
// beyond the standard anon client.

import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { createLead } from "@/lib/leads.server";
import { scoreLead } from "@/lib/lead-knowledge";
import { uploadClientDoc } from "@/lib/client-docs.server";
import {
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Paperclip,
  X,
  Upload,
} from "lucide-react";

export const Route = createFileRoute("/quote-request/")({
  component: QuoteRequestPage,
  loader: async () => ({ ok: true }),
});

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function QuoteRequestPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    interest: "",
    project_details: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const valid = selected.filter((f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE);
    const rejected = selected.filter((f) => !ACCEPTED_TYPES.includes(f.type) || f.size > MAX_FILE_SIZE);

    if (rejected.length > 0) {
      setMessage(
        `Some files were skipped: ${rejected.map((f) => f.name).join(", ")}. ` +
        `Accepted: PDF, JPG, PNG, WebP, DOC, DOCX, XLS, XLSX. Max 10MB each.`
      );
    }

    setFiles((prev) => [...prev, ...valid]);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setMessage("");
    setUploadingFiles(true);

    try {
      // Determine customer_type from interest
      const interest = form.interest.toLowerCase();
      let customerType: string = "residential_construction";
      if (interest.includes("resort") || interest.includes("hotel")) customerType = "resort";
      else if (interest.includes("commercial") || interest.includes("contractor")) customerType = "commercial_construction";
      else if (interest.includes("developer")) customerType = "developer";

      // Determine signals from interest + project_details
      const signals: string[] = [];
      if (interest.includes("window")) signals.push("windows");
      if (interest.includes("door")) signals.push("doors");
      if (interest.includes("glass")) signals.push("glass");
      if (interest.includes("facade") || interest.includes("storefront")) signals.push("facade");
      if (interest.includes("aluminum")) signals.push("aluminum");
      if (interest.includes("shower")) signals.push("glass");
      if (interest.includes("railing") || interest.includes("balcony")) signals.push("glass");
      if (form.project_details.toLowerCase().includes("new") || form.project_details.toLowerCase().includes("construction"))
        signals.push("new_construction");
      if (form.project_details.toLowerCase().includes("renovat"))
        signals.push("renovation");

      // Create the lead first
      const lead = await createLead({
        data: {
          source: "website",
          source_url: typeof window !== "undefined" ? window.location.href : "",
          customer_type: customerType,
          contact_name: form.name,
          phone: form.phone,
          email: form.email,
          project_location: form.location,
          project_description: form.project_details,
          signals: signals.length > 0 ? signals : undefined,
        },
      });

      const leadRef = (lead as any).lead_reference;
      const leadId = (lead as any).id;

      // Score the lead
      await scoreLead({
        data: { id: leadId },
      });

      // Upload attached files against the lead
      const uploadedDocs: any[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await fileToBase64(file);

        const doc = await uploadClientDoc({
          data: {
            lead_reference: leadRef,
            document_type:
              file.type === "application/pdf"
                ? "purchase_order"
                : file.type.startsWith("image/")
                ? "photo"
                : "other",
            file_name: file.name,
            file_mime: file.type,
            file_size_bytes: file.size,
            data_base64: base64,
          },
        });
        uploadedDocs.push(doc);
      }

      const docCount = uploadedDocs.length > 0 ? ` (${uploadedDocs.length} document(s) attached)` : "";

      setStatus("success");
      setMessage(
        `Thank you, ${form.name}! Your request has been received. ` +
        `Reference: ${leadRef}${docCount}. ` +
        `One of our team members will be in touch within 24 hours.`
      );
      setForm({ name: "", phone: "", email: "", location: "", interest: "", project_details: "" });
      setFiles([]);
    } catch (err) {
      setStatus("error");
      setMessage("Something went wrong. Please try again or call us at 0945 130 8277.");
      console.error("Quote request failed:", err);
    } finally {
      setUploadingFiles(false);
    }
  };

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("File read failed"));
      reader.readAsDataURL(file);
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Request a Quote</h1>
          <p className="mt-2 text-muted-foreground">
            Tell us about your project and we&apos;ll provide a customized solution.
          </p>
        </div>

        {status === "success" ? (
          <div className="mt-8 flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-emerald-100 p-4 text-emerald-600">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-lg font-semibold">Request Received</h2>
            <p className="text-sm text-muted-foreground max-w-md">{message}</p>
            <a
              href="/"
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-ring px-4 py-2 text-sm font-medium hover:bg-ring/90"
            >
              Back to Home
              <ArrowRight size={16} />
            </a>
          </div>
        ) : status === "error" ? (
          <div className="mt-8 flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-red-100 p-4 text-red-600">
              <AlertCircle size={48} />
            </div>
            <h2 className="text-lg font-semibold text-red-600">Submission Error</h2>
            <p className="text-sm text-muted-foreground">{message}</p>
            <button
              className="mt-2 rounded-lg bg-ring px-4 py-2 text-sm font-medium"
              onClick={() => setStatus("idle")}
            >
              Try Again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* ── Contact fields ── */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
              <input
                type="text"
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Juan Dela Cruz"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Phone *</label>
                <input
                  type="tel"
                  required
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="09XX XXX XXXX"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Location *</label>
              <input
                type="text"
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Puerto Princesa, El Nido, San Vicente, Port Barton..."
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">What are you interested in? *</label>
              <select
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.interest}
                onChange={(e) => handleChange("interest", e.target.value)}
              >
                <option value="">Select...</option>
                <optgroup label="Windows">
                  <option value="Sliding Windows">Sliding Windows</option>
                  <option value="Casement Windows">Casement Windows</option>
                  <option value="Awning Windows">Awning Windows</option>
                  <option value="Fixed Glass Windows">Fixed Glass Windows</option>
                </optgroup>
                <optgroup label="Doors">
                  <option value="Sliding Doors">Sliding Doors</option>
                  <option value="Swing Doors">Swing Doors</option>
                  <option value="Bi-fold Doors">Bi-fold Doors</option>
                  <option value="Screen Doors">Screen Doors</option>
                </optgroup>
                <optgroup label="Glass & Structural">
                  <option value="Shower Enclosure">Shower Enclosure</option>
                  <option value="Glass Railings">Glass Railings</option>
                  <option value="Storefront / Curtain Wall">Storefront / Curtain Wall</option>
                  <option value="Glass Canopies">Glass Canopies</option>
                  <option value="Glass Tabletops / Shelves">Glass Tabletops / Shelves</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="Aluminum Systems">Aluminum Systems</option>
                  <option value="ACP Panels">ACP Panels</option>
                  <option value="Glass Fish Tanks / Aquariums">Glass Fish Tanks / Aquariums</option>
                  <option value="Other">Other</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Tell us about your project</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y min-h-[100px]"
                value={form.project_details}
                onChange={(e) => handleChange("project_details", e.target.value)}
                placeholder="Project type, approximate size, timeline, any special requirements..."
              />
            </div>

            {/* ── File attachments ── */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Attach documents (optional)
              </label>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload your PO, quotation, sketch, or photos. Helps us prepare an accurate quote faster.
              </p>

              {/* File list */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {f.type.startsWith("image/") ? (
                          <Upload size={16} className="shrink-0 text-muted-foreground" />
                        ) : (
                          <Paperclip size={16} className="shrink-0 text-muted-foreground" />
                        )}
                        <span className="truncate text-sm">{f.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          ({(f.size / 1024 / 1024).toFixed(1)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        className="shrink-0 rounded text-muted-foreground hover:text-foreground"
                        onClick={() => removeFile(i)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* File input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                className="mt-2 w-full hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                className="mt-1 w-full rounded-lg border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground hover:border-ring hover:text-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} className="inline mr-2" />
                Choose Files...
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-ring text-ring-foreground px-4 py-2.5 text-sm font-semibold hover:bg-ring/90 flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={status === "submitting" || uploadingFiles}
            >
              {status === "submitting" || uploadingFiles ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Request
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              We respect your privacy. Your information is used only to prepare your quote.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
