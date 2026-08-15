import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Bot, Send, ShieldCheck, Database, Loader2 } from "lucide-react";
import { talaOperationalChat } from "@/lib/tala/chat.server";

export const Route = createFileRoute("/admin/tala/")({ component: TalaActivityPage });

type Message = { role: "owner" | "tala"; text: string };

function TalaActivityPage() {
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "tala", text: "TALA is ready for operational questions. Ask about overdue invoices, receivables, billing-ready projects, customers, projects, suppliers, supplier POs, or today's alerts." },
  ]);

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    if (!apiKey.trim() || !model.trim()) {
      setMessages((current) => [...current, { role: "owner", text: message }, { role: "tala", text: "OpenRouter is not configured for this session. Enter the API key and model above before running TALA." }]);
      setInput("");
      return;
    }
    setInput("");
    setMessages((current) => [...current, { role: "owner", text: message }]);
    setBusy(true);
    try {
      const result = await talaOperationalChat({ data: { message, apiKey: apiKey.trim(), model: model.trim() } });
      setMessages((current) => [...current, { role: "tala", text: result.reply }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "tala", text: error instanceof Error ? error.message : "TALA could not complete that request." }]);
    } finally { setBusy(false); }
  }

  return (
    <AdminLayout>
      <PageHeader title="TALA" subtitle="Azarraga owner operations agent" />

      <div className="grid gap-4 md:grid-cols-3">
        <Status icon={<Bot size={18}/>} label="Runtime" value="Operational integration" />
        <Status icon={<Database size={18}/>} label="Business tools" value="Phase 3 connected" />
        <Status icon={<ShieldCheck size={18}/>} label="Financial guardrail" value="Owner approval required" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Owner workspace</h2>
            <p className="text-sm text-muted-foreground">TALA reads operational data through deterministic server tools. It does not calculate invoice balances or invent business records.</p>
          </div>
          <div className="h-[480px] space-y-4 overflow-y-auto p-5">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "owner" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "owner" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>{message.text}</div>
              </div>
            ))}
            {busy && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 size={16} className="animate-spin"/>TALA is checking Azarraga operations…</div>}
          </div>
          <div className="flex gap-2 border-t border-border p-4">
            <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} placeholder="Ask: What invoices are overdue?" disabled={busy}/>
            <Button onClick={() => void send()} disabled={busy || !input.trim()}><Send size={16}/><span className="ml-2">Send</span></Button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">OpenRouter session</h3>
            <p className="mt-1 text-xs text-muted-foreground">Temporary until encrypted server-side provider settings are connected. The key is not written to browser storage by this screen.</p>
            <div className="mt-4 space-y-4">
              <div className="space-y-2"><Label>API key</Label><Input type="password" autoComplete="off" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-or-v1-…" /></div>
              <div className="space-y-2"><Label>Model ID</Label><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="provider/model:free" /></div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-semibold">Live tools connected</h3>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">Receivables<br/>Overdue invoices<br/>Collections / billing ready<br/>Customers<br/>Projects<br/>Suppliers<br/>Supplier purchase orders<br/>Operational alerts</p>
          </div>
        </aside>
      </div>
    </AdminLayout>
  );
}

function Status({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-card p-4 shadow-sm"><div className="flex items-center gap-2 text-muted-foreground">{icon}<span className="text-xs font-semibold uppercase tracking-wide">{label}</span></div><p className="mt-2 font-semibold">{value}</p></div>;
}
