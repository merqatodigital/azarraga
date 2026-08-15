import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/settings/")({
  component: SettingsPage,
});

function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string>("business");

  const sections = [
    { id: "business", label: "Business Profile", icon: "building", description: "Company name, address, contact details" },
    { id: "tala", label: "TALA", icon: "bot", description: "Agent name, behavior, and operational parameters" },
    { id: "models", label: "Models", icon: "cpu", description: "Model provider, OpenRouter model, Ollama configuration" },
    { id: "whatsapp", label: "WhatsApp", icon: "link", description: "WhatsApp channel adapter and webhook configuration" },
    { id: "notifications", label: "Notifications", icon: "bell", description: "Alert preferences and delivery channels" },
    { id: "users", label: "Users & Security", icon: "users", description: "Administrator accounts and access control" },
    { id: "documents", label: "Document Settings", icon: "file", description: "Document upload, extraction, and storage preferences" },
    { id: "website", label: "Website", icon: "globe", description: "Legacy website CMS passkey and related settings" },
  ] as const;

  return (
    <AdminLayout>
      <PageHeader
        title="Settings"
        description="Configure business profile, TALA, models, WhatsApp, notifications, users, documents, and website settings"
      />

      <div className="flex gap-6">
        <div className="shrink-0 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex w-48 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-muted-foreground"
              }`}
            >
              <IconComponent icon={section.icon} size={16} />
              {section.label}
            </button>
          ))}
        </div>

        <div className="flex-1">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <IconComponent icon={sections.find(s => s.id === activeSection)?.icon ?? "settings"} size={20} />
              <h2 className="text-base font-semibold">
                {sections.find(s => s.id === activeSection)?.label}
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {sections.find(s => s.id === activeSection)?.description}
            </p>

            <div className="mt-6 space-y-4">
              <SettingsSection section={activeSection} />
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function SettingsSection({ section }: { section: string }) {
  switch (section) {
    case "business":
      return (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input defaultValue="Azarraga Glass & Aluminum" />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input defaultValue="Fabrication and installation of Aluminum Doors, Windows and Screen Door" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input defaultValue="0945 130 8277" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input defaultValue="info@azarragaglass.com" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input defaultValue="Purok San Pedro, Brgy. San Manuel, Puerto Princesa City, Palawan" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Business profile settings. Changes here affect the public website and documents.
          </p>
        </>
      );

    case "tala":
      return (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Agent Name</Label>
              <Input defaultValue="TALA" />
            </div>
            <div className="space-y-2">
              <Label>Agent Role</Label>
              <Select defaultValue="service-business">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service-business">Service Business Agent</SelectItem>
                  <SelectItem value="resort-concierge">Resort Concierge</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            TALA is configured as a service-business agent for Azarraga. This setting determines the business context TALA operates in.
          </p>
        </>
      );

    case "models":
      return (
        <>
          <div className="rounded-xl border border-dashed border-border p-4">
            <p className="text-sm font-semibold">Provider</p>
            <Select defaultValue="openrouter">
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
                <SelectItem value="ollama">Ollama (local)</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-4 space-y-3">
              {providerFields("openrouter")}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Model provider selection. OpenRouter is the primary provider. Ollama is available for local/offline use. Provider-specific credentials are stored server-side.
          </p>
        </>
      );

    case "whatsapp":
      return (
        <>
          <div className="rounded-xl border border-dashed border-border p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v2m0 4h.01M12 3l9.66 16.5H2.34L12 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">WhatsApp Channel</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The WhatsApp channel adapter is not yet configured. When ready, enter the provider credentials below. Provider-specific credentials (API keys, tokens, phone numbers) are stored server-side and never exposed to the browser.
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select defaultValue="meta-cloud-api">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meta-cloud-api">Meta Cloud API</SelectItem>
                    <SelectItem value="twilio">Twilio</SelectItem>
                    <SelectItem value="custom">Custom Adapter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="+63 9XX XXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label>Webhook Endpoint</Label>
                <Input placeholder="https://your-domain.com/webhooks/whatsapp" readOnly className="text-xs text-muted-foreground" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Do not integrate a WhatsApp provider until the correct credentials and provider are confirmed. The webhook endpoint must be publicly reachable.
          </p>
        </>
      );

    case "notifications":
      return (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Daily Morning Briefing</p>
                <p className="text-xs text-muted-foreground">Send a daily summary to the owner via WhatsApp</p>
              </div>
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Overdue Invoice Alerts</p>
                <p className="text-xs text-muted-foreground">Notify when invoices become overdue</p>
              </div>
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs">Configure</Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">New Lead Notifications</p>
                <p className="text-xs text-muted-foreground">Notify when a new lead is captured</p>
              </div>
              <Button variant="outline" size="sm" className="h-8 px-3 text-xs">Configure</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Notification channels and preferences. Requires WhatsApp to be connected for proactive alerts.
          </p>
        </>
      );

    case "users":
      return (
        <>
          <div className="rounded-xl border border-dashed border-border p-4">
            <p className="text-sm font-semibold">Administrator Accounts</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Administrator accounts are managed through Supabase Auth. To add an administrator, provision a user in the Supabase dashboard with the appropriate role.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
              <div>
                <p className="text-sm font-medium">Owner</p>
                <p className="text-xs text-muted-foreground">Primary administrator</p>
              </div>
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">Active</span>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs">Add Administrator</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            User accounts are created in Supabase Auth. The admin interface requires a valid Supabase session. The legacy website CMS passkey is separate and remains for the website editor only.
          </p>
        </>
      );

    case "documents":
      return (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Storage Bucket</Label>
              <Input defaultValue="documents" readOnly />
            </div>
            <div className="space-y-2">
              <Label>Allowed File Types</Label>
              <Input defaultValue="PDF, PNG, JPG, WebP" readOnly />
            </div>
            <div className="space-y-2">
              <Label>Max File Size</Label>
              <Input defaultValue="25 MB" readOnly />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Document upload and extraction settings. TALA can extract structured data from uploaded quotations, purchase orders, invoices, and related documents.
          </p>
        </>
      );

    case "website":
      return (
        <>
          <div className="rounded-xl border border-dashed border-border p-4">
            <p className="text-sm font-semibold">Legacy Website CMS</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The website CMS currently uses a passkey for authentication. This will be replaced by Supabase Auth in a future update. The passkey is still required to save changes to the site_content table.
            </p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label>Current CMS Passkey</Label>
              <Input defaultValue="5309" readOnly className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>CMS Migration Status</Label>
              <Select defaultValue="pending">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="h-8 px-3 text-xs" disabled>
              Migrate to Supabase Auth
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The legacy passkey is preserved for the website CMS until Supabase Auth is fully wired for the CMS editor. Do not remove the passkey until the new auth path is verified.
          </p>
        </>
      );

    default:
      return <div className="text-sm text-muted-foreground">Section not found.</div>;
  }
}

function providerFields(provider: string) {
  if (provider === "openrouter") {
    return (
      <>
        <div className="space-y-2">
          <Label>OpenRouter API Key</Label>
          <Input placeholder="sk-or-v1-..." readOnly className="font-mono text-xs" />
        </div>
        <div className="space-y-2">
          <Label>Default Model</Label>
          <Select defaultValue="anthropic/claude-sonnet-4">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic/claude-sonnet-4">Claude Sonnet 4</SelectItem>
              <SelectItem value="google/gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
              <SelectItem value="openai/gpt-5">GPT-5</SelectItem>
              <SelectItem value="x-ai/grok-4">Grok 4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </>
    );
  }
  if (provider === "ollama") {
    return (
      <>
        <div className="space-y-2">
          <Label>Ollama Base URL</Label>
          <Input placeholder="http://localhost:11434" defaultValue="http://localhost:11434" />
        </div>
        <div className="space-y-2">
          <Label>Ollama Model</Label>
          <Input placeholder="llama3.2" defaultValue="llama3.2" />
        </div>
      </>
    );
  }
  return null;
}

function IconComponent({ icon, size }: { icon: string; size?: number }) {
  const icons: Record<string, any> = {
    building: Building,
    bot: Bot,
    cpu: Cpu,
    link: Link,
    bell: Bell,
    users: Users,
    file: FileText,
    globe: Globe,
    settings: Settings,
  };

  const Icon = icons[icon] ?? Settings;
  return <Icon size={size ?? 16} />;
}

// Import icons used above
import { Building, Bot, Cpu, Link, Bell, Users, FileText, Globe, Settings } from "lucide-react";
