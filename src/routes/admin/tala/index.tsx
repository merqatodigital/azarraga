import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { useState } from "react";

export const Route = createFileRoute("/admin/tala/")({ component: TalaActivityPage });

type Message = { role: "owner" | "tala"; text: string };

function TalaActivityPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "tala", text: "TALA workspace is ready. Connect an OpenRouter model in Settings to begin live operations." },
  ]);

  function queueMessage() {
    const text = input.trim();
    if (!text) return;
    setMessages((current) => [...current, { role: "owner", text }, { role: "tala", text: "Model connection is being wired server-side. I will use Azarraga business tools here once the provider is connected." }]);
    setInput("");
  }

  return (
    <AdminLayout>
      <PageHeader title="TALA" subtitle="Azarraga Glass & Aluminum business operations agent" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Status label="TALA Runtime" value="Integration" detail="Hosted runtime is being connected to this workspace." />
        <Status label="Model Provider" value="OpenRouter" detail="Free-model discovery and connection test are implemented in the TALA runtime." />
        <Status label="Financial Approval" value="Required" detail="Quotes, invoices and payment actions remain owner-controlled." />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-900">Ask TALA</h2>
            <p className="text-sm text-gray-500">Quotes, invoices, collections, leads and project operations.</p>
          </div>
          <div className="h-[420px] space-y-3 overflow-y-auto p-5">
            {messages.map((message, index) => (
              <div key={index} className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${message.role === "owner" ? "ml-auto bg-blue-950 text-white" : "bg-gray-100 text-gray-800"}`}>
                {message.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-gray-200 p-4">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") queueMessage(); }}
              placeholder="Ask TALA what needs attention..."
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-900"
            />
            <button onClick={queueMessage} className="rounded-lg bg-blue-950 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900">Send</button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900">Quick requests</h3>
            <div className="mt-3 space-y-2">
              {["What needs my attention today?", "Show quotes needing approval", "Who owes us money?", "Show overdue invoices", "Show new qualified leads"].map((prompt) => (
                <button key={prompt} onClick={() => setInput(prompt)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">{prompt}</button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            TALA may prepare financial actions, but owner approval is required before quotes or invoices are issued.
          </div>
        </aside>
      </div>
    </AdminLayout>
  );
}

function Status({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p><p className="mt-2 text-xl font-semibold text-gray-900">{value}</p><p className="mt-1 text-sm text-gray-500">{detail}</p></div>;
}
