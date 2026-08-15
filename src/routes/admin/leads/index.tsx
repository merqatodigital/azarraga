import { createFileRoute } from '@tanstack/react-router'
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { Building2, MapPin, Search, Target, Upload, Users } from "lucide-react";

export const Route = createFileRoute("/admin/leads/")({ component: LeadsPage });

const targets = [
  { place: "El Nido", focus: "Resorts · hotels · villas", signal: "New construction / renovation" },
  { place: "San Vicente", focus: "Resorts · residences · commercial", signal: "Development / architect plans" },
  { place: "Puerto Princesa", focus: "Commercial · residential · contractors", signal: "Build / renovation / tender" },
];

function LeadsPage() {
  return (
    <AdminLayout>
      <PageHeader title="Lead Intelligence" subtitle="Find real Palawan projects before they become quote requests" />

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 to-blue-950 p-6 text-white shadow-sm">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">Azarraga Commercial Agent</p>
          <h2 className="mt-2 text-2xl font-semibold">Find the project. Identify who controls the glass package.</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">Research developers, architects, contractors, resorts and commercial projects. Every opportunity stays evidence-based and requires review before outreach.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-950"><Search size={16}/> Research opportunities</button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white"><Upload size={16}/> Add known lead</button>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {targets.map((target) => (
          <article key={target.place} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 text-blue-900"><MapPin size={17}/><span className="text-sm font-semibold">{target.place}</span></div>
            <p className="mt-4 text-sm font-medium text-slate-900">{target.focus}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">Signal: {target.signal}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <PipelineCard icon={Target} title="Discover" text="New developments, renovations, tenders and active construction." />
        <PipelineCard icon={Users} title="Qualify" text="Identify owner, architect, contractor, stage, location and likely scope." />
        <PipelineCard icon={Building2} title="Convert" text="Move qualified opportunities toward one action: send us the plans." />
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div><h3 className="font-semibold text-slate-950">Opportunity queue</h3><p className="mt-1 text-sm text-slate-500">No fabricated demo leads. Researched or manually entered opportunities appear here.</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">0 reviewed</span>
        </div>
      </section>
    </AdminLayout>
  );
}

function PipelineCard({ icon: Icon, title, text }: { icon: typeof Target; title: string; text: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Icon size={20} className="text-blue-800"/><h3 className="mt-4 font-semibold text-slate-950">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div>
}
