import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Bot, Cpu, Link, Bell, Users, FileText, Globe, Settings, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { listFreeOpenRouterModels, type OpenRouterModel } from "@/lib/tala/openrouter-models";
import { testTalaModel } from "@/lib/tala/model-runtime";

export const Route = createFileRoute("/admin/settings/")({ component: SettingsPage });

const sections = [
  { id: "business", label: "Business Profile", icon: "building", description: "Company name, address, contact details" },
  { id: "tala", label: "TALA", icon: "bot", description: "Agent name, behavior, and operational parameters" },
  { id: "models", label: "Models", icon: "cpu", description: "Connect TALA to OpenRouter and choose a free model" },
  { id: "whatsapp", label: "WhatsApp", icon: "link", description: "WhatsApp channel adapter and webhook configuration" },
  { id: "notifications", label: "Notifications", icon: "bell", description: "Alert preferences and delivery channels" },
  { id: "users", label: "Users & Security", icon: "users", description: "Administrator accounts and access control" },
  { id: "documents", label: "Document Settings", icon: "file", description: "Document upload, extraction, and storage preferences" },
  { id: "website", label: "Website", icon: "globe", description: "Legacy website CMS status" },
] as const;

function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string>("business");
  const active = sections.find((s) => s.id === activeSection) ?? sections[0];
  return <AdminLayout>
    <PageHeader title="Settings" description="Configure Azarraga and the TALA business agent" />
    <div className="flex gap-6">
      <div className="shrink-0 space-y-1">{sections.map((section) => <button key={section.id} onClick={() => setActiveSection(section.id)} className={`flex w-48 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium ${activeSection === section.id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent/50"}`}><IconComponent icon={section.icon} size={16}/>{section.label}</button>)}</div>
      <div className="flex-1"><div className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center gap-2"><IconComponent icon={active.icon} size={20}/><h2 className="text-base font-semibold">{active.label}</h2></div><p className="mt-1 text-sm text-muted-foreground">{active.description}</p><div className="mt-6"><SettingsSection section={activeSection}/></div></div></div>
    </div>
  </AdminLayout>;
}

function SettingsSection({ section }: { section: string }) {
  if (section === "models") return <OpenRouterSettings/>;
  if (section === "business") return <div className="grid gap-4 md:grid-cols-2"><Field label="Business Name" value="Azarraga Glass & Aluminum"/><Field label="Phone" value="0945 130 8277"/><div className="md:col-span-2"><Field label="Address" value="Purok San Pedro, Brgy. San Manuel, Puerto Princesa City, Palawan"/></div></div>;
  if (section === "tala") return <div className="space-y-3"><Field label="Agent Name" value="TALA"/><p className="text-sm text-muted-foreground">Private operations agent for quotes, invoices, collections, leads and project operations.</p></div>;
  if (section === "whatsapp") return <Placeholder title="WhatsApp Channel" text="Channel adapter is isolated from the model runtime. Credentials will be stored server-side when the provider connection is added."/>;
  if (section === "notifications") return <Placeholder title="Operational Notifications" text="Morning briefings, overdue invoice alerts and lead alerts will use TALA's channel adapters."/>;
  if (section === "users") return <Placeholder title="Administrator Accounts" text="Admin access is protected by Supabase Auth."/>;
  if (section === "documents") return <Placeholder title="Document Intake" text="PDF, PNG, JPG and WebP documents can be passed to TALA's guarded extraction pipeline."/>;
  if (section === "website") return <Placeholder title="Legacy Website CMS" text="The existing CMS remains separate while the backoffice moves to Supabase Auth."/>;
  return null;
}

function OpenRouterSettings() {
  const [apiKey, setApiKey] = useState("");
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function loadModels() {
    setLoading(true); setStatus(null);
    try {
      const free = await listFreeOpenRouterModels(apiKey.trim() || undefined);
      setModels(free);
      if (free.length && !free.some((m) => m.id === model)) setModel(free[0].id);
      setStatus({ ok: true, text: `${free.length} currently free OpenRouter models found.` });
    } catch (error) { setStatus({ ok: false, text: error instanceof Error ? error.message : "Could not load OpenRouter models." }); }
    finally { setLoading(false); }
  }

  async function testConnection() {
    if (!apiKey.trim() || !model) { setStatus({ ok: false, text: "Enter an OpenRouter API key and select a model first." }); return; }
    setLoading(true); setStatus(null);
    try {
      const result = await testTalaModel({ apiKey: apiKey.trim(), model });
      setStatus({ ok: result.ok, text: `${result.reply} (${result.model})` });
    } catch (error) { setStatus({ ok: false, text: error instanceof Error ? error.message : "TALA connection test failed." }); }
    finally { setLoading(false); }
  }

  return <div className="space-y-5">
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center justify-between"><div><p className="font-semibold">OpenRouter</p><p className="text-xs text-muted-foreground">TALA's hosted model provider. No paid fallback is selected automatically.</p></div><span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">Primary</span></div>
      <div className="mt-5 space-y-4">
        <div className="space-y-2"><Label>OpenRouter API Key</Label><Input type="password" autoComplete="off" placeholder="sk-or-v1-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="font-mono text-xs"/><p className="text-xs text-amber-700">Temporary integration field: do not save this key in browser storage. Server-side secret persistence is the next connection step.</p></div>
        <div className="flex gap-2"><Button type="button" variant="outline" onClick={loadModels} disabled={loading}><RefreshCw size={15} className={loading ? "mr-2 animate-spin" : "mr-2"}/>Load Free Models</Button></div>
        <div className="space-y-2"><Label>Free Model</Label><Select value={model} onValueChange={setModel} disabled={!models.length}><SelectTrigger><SelectValue placeholder="Load free models first"/></SelectTrigger><SelectContent>{models.map((item) => <SelectItem key={item.id} value={item.id}>{item.name || item.id}{item.context_length ? ` · ${item.context_length.toLocaleString()} ctx` : ""}</SelectItem>)}</SelectContent></Select></div>
        <Button type="button" onClick={testConnection} disabled={loading || !apiKey || !model}>Test TALA Connection</Button>
        {status && <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${status.ok ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>{status.ok ? <CheckCircle2 size={17}/> : <AlertCircle size={17}/>}<span>{status.text}</span></div>}
      </div>
    </div>
  </div>;
}

function Field({ label, value }: { label: string; value: string }) { return <div className="space-y-2"><Label>{label}</Label><Input defaultValue={value}/></div>; }
function Placeholder({ title, text }: { title: string; text: string }) { return <div className="rounded-xl border border-dashed border-border p-4"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{text}</p></div>; }
function IconComponent({ icon, size }: { icon: string; size?: number }) { const icons: Record<string, any> = { building: Building, bot: Bot, cpu: Cpu, link: Link, bell: Bell, users: Users, file: FileText, globe: Globe, settings: Settings }; const Icon = icons[icon] ?? Settings; return <Icon size={size ?? 16}/>; }
