import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { FileText, MessageSquareText, Ruler, ShieldCheck, Upload } from "lucide-react";

export const Route = createFileRoute("/admin/quotes/")({ component: QuotesPage });

function QuotesPage() {
  return (
    <AdminLayout>
      <PageHeader title="Quotes" subtitle="Plans or measurements in. Reviewable Azarraga quotation out." />

      <section className="rounded-2xl border border-blue-100 bg-blue-950 p-6 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">New quotation</p>
        <h2 className="mt-2 text-2xl font-semibold">Start with whatever the customer has.</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">Architectural PDF, door/window schedule, site measurements, photos, or a plain-language customer request. The agent structures the job; deterministic tools do the arithmetic.</p>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StartCard icon={Upload} title="Upload Plans" text="Architectural plans, schedules and specifications. Extract openings and build a preliminary takeoff." cta="Choose files" />
        <StartCard icon={Ruler} title="Enter Measurements" text="Start from a completed site survey or known opening dimensions." cta="Enter measurements" />
        <StartCard icon={MessageSquareText} title="Customer Request" text="Turn a message, photo set or verbal requirement into the questions needed to quote." cta="Start intake" />
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-900"><ShieldCheck size={19}/></div>
          <div><h3 className="font-semibold text-slate-950">Quote guardrails</h3><p className="mt-1 text-sm leading-6 text-slate-500">Historical selling prices are evidence, not today's price list. Missing current costs, uncertain dimensions, safety glazing and engineered coastal openings are flagged for human review before issue.</p></div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5"><h3 className="font-semibold text-slate-950">Quotation pipeline</h3><p className="mt-1 text-sm text-slate-500">Drafts, revisions, approvals and sent quotations will appear here.</p></div>
        <div className="grid gap-px bg-slate-100 sm:grid-cols-4">
          {['Draft','Needs review','Approved','Sent'].map((stage) => <div key={stage} className="bg-white p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{stage}</p><p className="mt-2 text-2xl font-semibold text-slate-950">0</p></div>)}
        </div>
      </section>
    </AdminLayout>
  );
}

function StartCard({ icon: Icon, title, text, cta }: { icon: typeof FileText; title: string; text: string; cta: string }) {
  return <article className="flex min-h-56 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="w-fit rounded-lg bg-blue-50 p-2.5 text-blue-900"><Icon size={21}/></div><h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{text}</p><button className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">{cta}</button></article>
}
