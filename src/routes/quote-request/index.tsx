// Public quote-request form for Azarraga Glass & Aluminum.
// The form submits enquiries to the existing lead workflow and reads its
// presentation options from the public website content managed in Admin.

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { getSiteContent } from "@/lib/site-content.functions";
import { createLead, scoreLead } from "@/lib/leads.server";
import { uploadClientDoc } from "@/lib/client-docs.server";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileImage,
  Loader2,
  MapPin,
  Paperclip,
  Phone,
  Search,
  Ruler,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

export const Route = createFileRoute("/quote-request/")({
  component: QuoteRequestPage,
  loader: async () => ({ ok: true }),
  head: () => ({
    meta: [
      { title: "Request a Quote | Azarraga Glass & Aluminum" },
      { name: "description", content: "Tell Azarraga Glass & Aluminum about your window, door, or glass project in Palawan and request a tailored quotation." },
    ],
  }),
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
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_SERVICES = [
  { title: "Windows", products: ["Casement Windows", "Awning Windows", "Sliding Windows", "Jalousie Windows", "Fixed Windows", "Folding Windows"] },
  { title: "Doors", products: ["Bi-Fold Doors", "Sliding Doors", "Casement/Swing Doors", "Roll-Up Doors", "Hanging Doors", "Screen Doors"] },
  { title: "Glass & Architectural Works", products: ["Skylight", "Glass Railings", "Sunroom", "Stainless Steel Works", "ACP Cladding & Others", "Shower Enclosures", "Storefront / Curtain Wall"] },
];

interface ServiceOptionGroup {
  title: string;
  products: { name: string; systems: string[] }[];
}

interface QuotePageContent {
  primary: string;
  primaryDark: string;
  title: string;
  subtitle: string;
  formTitle: string;
  formIntro: string;
  attachmentHelp: string;
  privacyNote: string;
  submitLabel: string;
  phone: string;
  email: string;
  address: string;
  services: ServiceOptionGroup[];
  extraServices: string[];
  projectTypes: string[];
  timelines: string[];
  budgetRanges: string[];
}

const DEFAULT_CONTENT: QuotePageContent = {
  primary: "#0b3b8f",
  primaryDark: "#082f73",
  title: "Request a Quote",
  subtitle: "Tell us about your project and we’ll help you plan the right glass and aluminum solution.",
  formTitle: "Tell us what you need",
  formIntro: "Share a few project details and our Palawan team will follow up about the next step.",
  attachmentHelp: "Add a sketch, site photo, plan, or reference image to help us understand the project.",
  privacyNote: "Your information is used only to respond to this enquiry and prepare your quotation.",
  submitLabel: "Send my quote request",
  phone: "0945 130 8277",
  email: "info@azarragaglass.com",
  address: "Puerto Princesa City, Palawan",
  services: DEFAULT_SERVICES.map((group) => ({
    title: group.title,
    products: group.products.map((name) => ({ name, systems: [] })),
  })),
  extraServices: ["Aluminum Systems", "Other"],
  projectTypes: ["New construction", "Renovation or replacement", "Commercial fit-out", "Resort or hospitality", "Other"],
  timelines: ["As soon as possible", "Within 1–3 months", "Within 3–6 months", "Planning / no fixed date"],
  budgetRanges: ["Under ₱50,000", "₱50,000–₱150,000", "₱150,000–₱500,000", "Over ₱500,000", "Not sure yet"],
};

const inputClass = "mt-1.5 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
const selectClass = `${inputClass} appearance-none`;
const labelClass = "block text-[12px] font-semibold text-slate-700";

export function QuoteRequestPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState<QuotePageContent>(DEFAULT_CONTENT);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    interests: [] as string[],
    projectType: "",
    timeline: "",
    budget: "",
    project_details: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [message, setMessage] = useState("");
  const [fileNotice, setFileNotice] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    getSiteContent()
      .then(({ data }) => {
        if (cancelled || !asRecord(data)) return;
        setContent((current) => readQuoteContent(data, current));
      })
      .catch((error) => console.warn("Quote page using default content; website CMS could not be loaded.", error));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const product = params.get("product") ?? "";
    const system = params.get("system") ?? "";
    const interest = system || product;
    const selectedSystem = product && product !== interest ? `Selected system: ${product}.` : "";
    const detailNote = params.get("project_details") ?? "";
    if (interest || selectedSystem || detailNote) {
      setForm((current) => ({
        ...current,
        name: params.get("name") ?? current.name,
        phone: params.get("phone") ?? current.phone,
        email: params.get("email") ?? current.email,
        location: params.get("location") ?? current.location,
        interests: interest ? [interest] : current.interests,
        project_details: [selectedSystem, detailNote].filter(Boolean).join(" ").trim(),
      }));
    }
  }, []);

  const serviceGroups = useMemo(() => {
    const extras = content.extraServices.filter(
      (name) => !content.services.some((group) => group.products.some((product) => product.name === name)),
    );
    return extras.length > 0
      ? [...content.services, { title: "Other Services", products: extras.map((name) => ({ name, systems: [] })) }]
      : content.services;
  }, [content.extraServices, content.services]);

  const filteredServiceGroups = useMemo(() => {
    const query = serviceSearch.trim().toLowerCase();
    if (!query) return serviceGroups;
    return serviceGroups
      .map((group) => ({
        ...group,
        products: group.products.filter((product) =>
          product.name.toLowerCase().includes(query) || product.systems.some((system) => system.toLowerCase().includes(query)),
        ),
      }))
      .filter((group) => group.products.length > 0);
  }, [serviceGroups, serviceSearch]);

  const toggleInterest = (service: string) => {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(service)
        ? current.interests.filter((item) => item !== service)
        : [...current.interests, service],
    }));
    if (message) setMessage("");
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (message) setMessage("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    const valid = selected.filter((file) => ACCEPTED_TYPES.includes(file.type) && file.size <= MAX_FILE_SIZE);
    const rejected = selected.filter((file) => !ACCEPTED_TYPES.includes(file.type) || file.size > MAX_FILE_SIZE);
    if (rejected.length) {
      setFileNotice(`${rejected.map((file) => file.name).join(", ")} could not be added. Use PDF, JPG, PNG, WebP, DOC, DOCX, XLS, or XLSX files up to 10 MB each.`);
    } else if (valid.length) {
      setFileNotice("");
    }
    setFiles((current) => {
      const next = [...current];
      for (const file of valid) {
        if (!next.some((existing) => existing.name === file.name && existing.size === file.size)) next.push(file);
      }
      return next;
    });
    event.target.value = "";
  };

  const removeFile = (index: number) => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.interests.length === 0) {
      setMessage("Please select at least one product or service so we can direct your request to the right team.");
      return;
    }
    setStatus("submitting");
    setMessage("");

    const detailLines = [
      `Requested products/services: ${form.interests.join(", ")}`,
      form.projectType && `Project type: ${form.projectType}`,
      form.timeline && `Preferred timeline: ${form.timeline}`,
      form.budget && `Indicative budget: ${form.budget}`,
      form.project_details.trim(),
    ].filter(Boolean);
    const interest = form.interests.join(" ").toLowerCase();
    const signals: string[] = [];
    if (interest.includes("window")) signals.push("windows");
    if (interest.includes("door")) signals.push("doors");
    if (interest.includes("glass")) signals.push("glass");
    if (interest.includes("facade") || interest.includes("storefront") || interest.includes("cladding")) signals.push("facade");
    if (interest.includes("aluminum")) signals.push("aluminum");
    if (interest.includes("shower")) signals.push("glass");
    if (interest.includes("railing") || interest.includes("balcony")) signals.push("glass");
    if (form.projectType.toLowerCase().includes("new") || form.projectType.toLowerCase().includes("construction")) signals.push("new_construction");
    if (form.projectType.toLowerCase().includes("renovat")) signals.push("renovation");

    let leadReference = "";
    let leadId = "";
    try {
      const projectType = form.projectType.toLowerCase();
      let customerType = "residential_construction";
      if (projectType.includes("resort") || projectType.includes("hospitality")) customerType = "resort";
      else if (projectType.includes("commercial") || projectType.includes("contractor")) customerType = "commercial_construction";
      else if (projectType.includes("developer")) customerType = "developer";

      const lead = (await createLead({
        data: {
          source: "website",
          source_url: typeof window !== "undefined" ? window.location.href : "",
          customer_type: customerType,
          contact_name: form.name,
          phone: form.phone,
          email: form.email,
          project_location: form.location,
          project_description: detailLines.join("\n"),
          signals: signals.length ? signals : undefined,
        },
      })) as { lead_reference?: string; id?: string };

      leadReference = lead.lead_reference ?? "received";
      leadId = lead.id ?? "";
      if (leadId) {
        try {
          await scoreLead({ data: { id: leadId } });
        } catch (error) {
          console.warn("Lead created, but automatic lead scoring did not complete.", error);
        }
      }

      let uploadedCount = 0;
      let failedUploads = 0;
      for (const file of files) {
        try {
          const base64 = await fileToBase64(file);
          await uploadClientDoc({
            data: {
              lead_reference: leadReference,
              document_type: file.type === "application/pdf" ? "purchase_order" : file.type.startsWith("image/") ? "photo" : "other",
              file_name: file.name,
              file_mime: file.type,
              file_size_bytes: file.size,
              data_base64: base64,
            },
          });
          uploadedCount += 1;
        } catch (error) {
          failedUploads += 1;
          console.error(`Could not attach ${file.name} to quote enquiry.`, error);
        }
      }

      const attachmentMessage = uploadedCount ? ` ${uploadedCount} file${uploadedCount === 1 ? "" : "s"} attached.` : "";
      const failedMessage = failedUploads ? ` We received your request, but ${failedUploads} file${failedUploads === 1 ? " was" : "s were"} not attached—please email or call us.` : "";
      setMessage(`Thank you, ${form.name}. Your request has been received. Reference: ${leadReference}.${attachmentMessage}${failedMessage}`);
      setStatus("success");
    } catch (error) {
      console.error("Quote request failed:", error);
      setMessage("We couldn’t send your request just now. Your details are still here—please try again or contact our team directly.");
      setStatus("idle");
    }
  };

  const pageStyle = {
    "--quote-primary": content.primary,
    "--quote-primary-dark": content.primaryDark,
  } as CSSProperties;
  const phoneLink = content.phone.replace(/[^+\d]/g, "");

  return (
    <main className="quote-page min-h-screen overflow-hidden bg-[#f4f7fc] text-slate-900" style={pageStyle}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[390px] bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.14),transparent_58%),radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.10),transparent_48%)]" />
      <header className="relative z-10 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <a href="/" aria-label="Azarraga Glass & Aluminum home" className="flex min-w-0 items-center gap-3">
            <img src="/images/logo.png" alt="Azarraga Glass & Aluminum" className="h-10 w-auto object-contain sm:h-12" />
            <span className="hidden border-l border-slate-200 pl-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 sm:block">Palawan · Since 2012</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 sm:inline-flex">
              <ArrowLeft size={14} aria-hidden="true" /> Back to website
            </a>
            <a href={`tel:${phoneLink}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 shadow-sm transition hover:border-blue-200 hover:text-blue-800 sm:px-4">
              <Phone size={15} className="text-blue-800" aria-hidden="true" />
              <span className="hidden sm:inline">{content.phone}</span>
              <span className="sm:hidden">Call us</span>
            </a>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-8 sm:px-6 sm:pt-11 lg:px-8 lg:pb-16">
        <div className="mb-7 max-w-3xl sm:mb-9">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-800 shadow-sm">
            <Sparkles size={13} aria-hidden="true" /> Custom glass & aluminum solutions
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-[46px]" style={{ color: content.primary }}>
            {content.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{content.subtitle}</p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:gap-8">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className="quote-side-panel relative overflow-hidden rounded-[28px] p-6 text-white shadow-xl sm:p-7" style={{ backgroundImage: `linear-gradient(145deg, ${content.primaryDark} 0%, ${content.primary} 68%, #0f6c9d 100%)` }}>
              <div className="quote-side-orb" aria-hidden="true" />
              <div className="relative z-10">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.17em] text-blue-100">Let’s plan it right</span>
                <h2 className="mt-4 max-w-sm text-2xl font-bold leading-tight sm:text-[28px]">A clear brief is the first step to a better build.</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-blue-100">Share the opening size, site location, or a reference photo. We’ll use it to understand what your project needs.</p>

                <div className="mt-7 space-y-4">
                  {[
                    { icon: Ruler, title: "Tell us about the opening", description: "Approximate width, height, and quantity are helpful." },
                    { icon: FileImage, title: "Add a photo or plan", description: "A quick sketch or site image can speed up the assessment." },
                    { icon: CheckCircle2, title: "Get a measured proposal", description: "Final pricing is confirmed after specifications and site conditions are reviewed." },
                  ].map((item, index) => {
                    const StepIcon = item.icon;
                    return (
                      <div key={item.title} className="flex items-start gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/15 bg-white/10 text-cyan-100"><StepIcon size={17} aria-hidden="true" /></div>
                        <div className="pt-0.5">
                          <p className="text-[12px] font-bold text-white">0{index + 1} · {item.title}</p>
                          <p className="mt-1 text-[11px] leading-5 text-blue-100/85">{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"><MapPin size={13} className="text-blue-800" aria-hidden="true" /> Service area</div>
                <p className="mt-2 text-sm font-semibold text-slate-800">{content.address}</p>
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400"><ShieldCheck size={13} className="text-blue-800" aria-hidden="true" /> Prefer to talk?</div>
                <a href={`tel:${phoneLink}`} className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-blue-800 hover:underline">{content.phone}<ArrowRight size={14} aria-hidden="true" /></a>
                {content.email && <a href={`mailto:${content.email}`} className="mt-1 block text-xs text-slate-500 hover:text-blue-800">{content.email}</a>}
              </div>
            </div>
          </aside>

          <section className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_22px_70px_rgba(15,23,42,0.09)]" aria-labelledby="quote-form-title">
            {status === "success" ? (
              <div className="flex min-h-[620px] flex-col items-center justify-center px-6 py-12 text-center sm:px-10">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner"><CheckCircle2 size={34} aria-hidden="true" /></div>
                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">Request received</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">Thanks, {form.name}.</h2>
                <p className="mt-3 max-w-md whitespace-pre-line text-sm leading-6 text-slate-600">{message}</p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <a href="/" className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${content.primary}, ${content.primaryDark})` }}>
                    Back to website <ArrowRight size={16} aria-hidden="true" />
                  </a>
                  <a href={`tel:${phoneLink}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"><Phone size={15} aria-hidden="true" /> Call our team</a>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b border-slate-100 bg-gradient-to-r from-white to-blue-50/60 px-5 py-5 sm:px-8 sm:py-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-800">Project enquiry</p>
                      <h2 id="quote-form-title" className="mt-1.5 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{content.formTitle}</h2>
                      <p className="mt-1.5 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">{content.formIntro}</p>
                    </div>
                    <div className="hidden h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-blue-800 shadow-sm ring-1 ring-blue-100 sm:grid"><ClipboardListIcon /></div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-7 px-5 py-6 sm:px-8 sm:py-8">
                  {message && (
                    <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                      <span className="mt-0.5"><X size={16} aria-hidden="true" /></span><span>{message}</span>
                    </div>
                  )}

                  <fieldset className="space-y-4">
                    <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-[10px] text-blue-800">01</span> Your contact details</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className={`${labelClass} sm:col-span-2`}>
                        Full name <span className="text-rose-500">*</span>
                        <input autoComplete="name" required maxLength={120} className={inputClass} value={form.name} onChange={(event) => handleChange("name", event.target.value)} placeholder="Juan Dela Cruz" />
                      </label>
                      <label className={labelClass}>
                        Mobile number <span className="text-rose-500">*</span>
                        <input autoComplete="tel" inputMode="tel" type="tel" required maxLength={32} className={inputClass} value={form.phone} onChange={(event) => handleChange("phone", event.target.value)} placeholder="09XX XXX XXXX" />
                      </label>
                      <label className={labelClass}>
                        Email address <span className="font-normal text-slate-400">(optional)</span>
                        <input autoComplete="email" type="email" maxLength={254} className={inputClass} value={form.email} onChange={(event) => handleChange("email", event.target.value)} placeholder="you@example.com" />
                      </label>
                      <label className={`${labelClass} sm:col-span-2`}>
                        Project location <span className="text-rose-500">*</span>
                        <input autoComplete="address-level2" required maxLength={180} className={inputClass} value={form.location} onChange={(event) => handleChange("location", event.target.value)} placeholder="Barangay, city or municipality in Palawan" />
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="space-y-4 border-t border-slate-100 pt-6">
                    <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-[10px] text-blue-800">02</span> Project details</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <div className="flex flex-wrap items-end justify-between gap-2">
                          <div>
                            <p className={labelClass}>Products or services <span className="text-rose-500">*</span></p>
                            <p className="mt-1 text-[11px] font-normal text-slate-500">Choose as many as you need. You can include multiple product types in one request.</p>
                          </div>
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-800">{form.interests.length} selected</span>
                        </div>
                        <div className="relative mt-3">
                          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                          <input
                            type="search"
                            value={serviceSearch}
                            onChange={(event) => setServiceSearch(event.target.value)}
                            placeholder="Search windows, doors, railings, systems…"
                            aria-label="Search product and service options"
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                        {form.interests.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2" aria-label="Selected services">
                            {form.interests.map((service) => (
                              <span key={service} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-[10px] font-semibold text-blue-900">
                                <span className="max-w-[240px] truncate">{service}</span>
                                <button type="button" aria-label={`Remove ${service}`} onClick={() => toggleInterest(service)} className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-blue-700 hover:bg-blue-100"><X size={11} aria-hidden="true" /></button>
                              </span>
                            ))}
                            <button type="button" onClick={() => setForm((current) => ({ ...current, interests: [] }))} className="px-2 text-[10px] font-semibold text-slate-500 underline decoration-dotted underline-offset-2 hover:text-slate-800">Clear all</button>
                          </div>
                        )}
                        <div className="mt-3 space-y-2">
                          {filteredServiceGroups.length > 0 ? filteredServiceGroups.map((group) => {
                            const groupOptions = group.products.flatMap((product) => [product.name, ...product.systems.map((system) => `${product.name} — ${system}`)]);
                            const selectedCount = groupOptions.filter((option) => form.interests.includes(option)).length;
                            return (
                              <details key={group.title} open={Boolean(serviceSearch.trim())} className="group rounded-xl border border-slate-200 bg-white">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 transition hover:bg-slate-50">
                                  <span>{group.title}<span className="ml-2 text-[10px] font-medium text-slate-400">{group.products.length} products</span></span>
                                  <span className="flex items-center gap-2">
                                    {selectedCount > 0 && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold text-blue-800">{selectedCount} selected</span>}
                                    <span className="text-slate-400 transition group-open:rotate-180" aria-hidden="true">⌄</span>
                                  </span>
                                </summary>
                                <div className="grid gap-2 border-t border-slate-100 p-3 sm:grid-cols-2">
                                  {group.products.map((product) => (
                                    <div key={product.name} className="rounded-lg bg-slate-50/80 p-2.5">
                                      <label className="flex cursor-pointer items-start gap-2.5 rounded-md px-1 py-1.5 text-[11px] font-semibold leading-4 text-slate-800 hover:text-blue-800">
                                        <input type="checkbox" checked={form.interests.includes(product.name)} onChange={() => toggleInterest(product.name)} className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-800" />
                                        <span>{product.name}</span>
                                      </label>
                                      {product.systems.length > 0 && (
                                        <div className="ml-2 mt-1 space-y-1 border-l border-blue-100 pl-3">
                                          {product.systems.map((system) => {
                                            const value = `${product.name} — ${system}`;
                                            return (
                                              <label key={system} className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-1 text-[10px] leading-4 text-slate-600 hover:text-blue-800">
                                                <input type="checkbox" checked={form.interests.includes(value)} onChange={() => toggleInterest(value)} className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-300 accent-blue-800" />
                                                <span>{system}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            );
                          }) : (
                            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500">No products match “{serviceSearch}”. Try a different search.</div>
                          )}
                        </div>
                      </div>
                      <label className={labelClass}>
                        Project type
                        <select className={selectClass} value={form.projectType} onChange={(event) => handleChange("projectType", event.target.value)}>
                          <option value="">Select project type</option>
                          {content.projectTypes.map((value) => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </label>
                      <label className={labelClass}>
                        When do you need it?
                        <select className={selectClass} value={form.timeline} onChange={(event) => handleChange("timeline", event.target.value)}>
                          <option value="">Choose a timeline</option>
                          {content.timelines.map((value) => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </label>
                      <label className={`${labelClass} sm:col-span-2`}>
                        Approximate budget <span className="font-normal text-slate-400">(optional · PHP)</span>
                        <select className={selectClass} value={form.budget} onChange={(event) => handleChange("budget", event.target.value)}>
                          <option value="">Prefer not to say</option>
                          {content.budgetRanges.map((value) => <option key={value} value={value}>{value}</option>)}
                        </select>
                      </label>
                      <label className={`${labelClass} sm:col-span-2`}>
                        Project brief
                        <textarea rows={5} maxLength={4000} className="mt-1.5 min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" value={form.project_details} onChange={(event) => handleChange("project_details", event.target.value)} placeholder="Approximate width × height, number of openings, preferred glass or frame finish, access notes, or any questions…" />
                        <span className="mt-1 block text-right text-[10px] font-normal text-slate-400">{form.project_details.length}/4000</span>
                      </label>
                    </div>
                  </fieldset>

                  <fieldset className="border-t border-slate-100 pt-6">
                    <legend className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-[10px] text-blue-800">03</span> Helpful references <span className="text-[11px] font-normal text-slate-400">(optional)</span></legend>
                    <p className="mb-3 text-xs leading-5 text-slate-500">{content.attachmentHelp}</p>
                    <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx" className="sr-only" onChange={handleFileChange} />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="group flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 px-4 py-5 text-center transition hover:border-blue-400 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-800 shadow-sm transition group-hover:-translate-y-0.5"><Upload size={18} aria-hidden="true" /></span>
                      <span className="mt-2 text-xs font-bold text-slate-800">Choose photos or documents</span>
                      <span className="mt-1 text-[10px] text-slate-500">PDF, JPG, PNG, WebP, DOCX or XLSX · up to 10 MB each</span>
                    </button>
                    {fileNotice && <p role="alert" className="mt-2 text-xs text-amber-700">{fileNotice}</p>}
                    {files.length > 0 && (
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {files.map((file, index) => (
                          <li key={`${file.name}-${file.size}-${index}`} className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                            {file.type.startsWith("image/") ? <FileImage size={16} className="shrink-0 text-blue-700" aria-hidden="true" /> : <Paperclip size={16} className="shrink-0 text-blue-700" aria-hidden="true" />}
                            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-700">{file.name}</span>
                            <span className="shrink-0 text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                            <button type="button" aria-label={`Remove ${file.name}`} onClick={() => removeFile(index)} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"><X size={14} aria-hidden="true" /></button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </fieldset>

                  <div className="border-t border-slate-100 pt-5">
                    <label className="flex items-start gap-3 text-xs leading-5 text-slate-600">
                      <input required type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-blue-800" />
                      <span>I agree that Azarraga Glass & Aluminum may contact me about this project and use these details to prepare a quotation.</span>
                    </label>
                    <button type="submit" disabled={status === "submitting"} className="quote-submit-button group mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700 disabled:cursor-wait disabled:opacity-70" style={{ backgroundImage: `linear-gradient(135deg, ${content.primary}, ${content.primaryDark})` }}>
                      {status === "submitting" ? <><Loader2 size={17} className="animate-spin" aria-hidden="true" /> Sending securely…</> : <>{content.submitLabel}<ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></>}
                    </button>
                    <p className="mt-3 flex items-start justify-center gap-1.5 text-center text-[10px] leading-4 text-slate-400"><ShieldCheck size={13} className="mt-0.5 shrink-0" aria-hidden="true" />{content.privacyNote}</p>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function readQuoteContent(raw: Record<string, unknown>, current: QuotePageContent): QuotePageContent {
  const theme = asRecord(raw.theme) ? raw.theme : {};
  const quote = asRecord(raw.quote) ? raw.quote : {};
  const quotePage = asRecord(raw.quotePage) ? raw.quotePage : {};
  const contact = asRecord(raw.contact) ? raw.contact : {};
  const primary = readString(theme.primary, current.primary);
  const primaryDark = readString(theme.primaryDark, current.primaryDark);
  const services = Array.isArray(raw.services)
    ? raw.services.filter(asRecord).map((group) => ({
        title: readString(group.title, "Services"),
        products: Array.isArray(group.products)
          ? group.products.filter(asRecord).map((product) => ({
              name: readString(product.name, "Other service"),
              systems: Array.isArray(product.subProducts)
                ? product.subProducts.filter(asRecord).map((system) => readString(system.name, "")).filter(Boolean)
                : [],
            }))
          : [],
      })).filter((group) => group.products.length > 0)
    : current.services;

  return {
    primary,
    primaryDark,
    title: readString(quote.title, current.title),
    subtitle: readString(quote.subtitle, current.subtitle),
    formTitle: readString(quotePage.formTitle, current.formTitle),
    formIntro: readString(quotePage.formIntro, current.formIntro),
    attachmentHelp: readString(quotePage.attachmentHelp, current.attachmentHelp),
    privacyNote: readString(quotePage.privacyNote, current.privacyNote),
    submitLabel: readString(quotePage.submitLabel, current.submitLabel),
    phone: readString(contact.phone, current.phone),
    email: readString(contact.email, current.email),
    address: readString(contact.address, current.address),
    services,
    extraServices: readStringArray(quote.services, current.extraServices),
    projectTypes: readStringArray(quotePage.projectTypes, current.projectTypes),
    timelines: readStringArray(quotePage.timelines, current.timelines),
    budgetRanges: readStringArray(quotePage.budgetRanges, current.budgetRanges),
  };
}

function asRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function readStringArray(value: unknown, fallback: string[]): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : fallback;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read the selected file."));
    reader.readAsDataURL(file);
  });
}

function ClipboardListIcon() {
  return <Check size={18} aria-hidden="true" />;
}
