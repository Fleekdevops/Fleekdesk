"use client";
import { useState } from "react";
import type { AnalysisResult } from "@/lib/schema";
import { formatBudget, stageLabel, waNumber } from "@/lib/format";

function Copy({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn-ghost !px-3 !py-2" onClick={async () => {
      await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500);
    }}>{done ? "Copied ✓" : label}</button>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const empty = value == null || value === "";
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 py-2 last:border-0">
      <dt className="shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-medium">{empty ? <span className="text-slate-400">—</span> : value}</dd>
    </div>
  );
}

export function AnalysisView({ analysis, onWhatsappChange }: { analysis: AnalysisResult; onWhatsappChange?: (v: string) => void }) {
  const [tab, setTab] = useState<"wa" | "email">("wa");
  const { client: c, followup: f } = analysis;
  const num = waNumber(c.phone);
  const waHref = `https://wa.me/${num ?? ""}?text=${encodeURIComponent(f.whatsapp)}`;
  const list = (a: string[]) => (a.length ? a.join(", ") : null);

  return (
    <div className="space-y-4">
      <section className="card">
        <h2 className="mb-2 font-semibold">Summary</h2>
        <p className="text-sm leading-relaxed">{analysis.summary}</p>
      </section>

      <section className="card">
        <h2 className="mb-2 font-semibold">Action items</h2>
        {analysis.action_items.length === 0 ? <p className="text-sm text-slate-400">None found</p> : (
          <ul className="space-y-3">
            {analysis.action_items.map((a, i) => (
              <li key={i} className="text-sm">
                <p className="font-medium">{a.task}</p>
                <p className="text-slate-500">Owner: {a.owner ?? "—"} · Due: {a.due_date ?? a.due_text ?? "—"}{a.due_date && a.due_text ? ` (${a.due_text})` : ""}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="mb-1 font-semibold">Client details</h2>
        <dl>
          <Row label="Name" value={c.name} />
          <Row label="Phone" value={c.phone} />
          <Row label="Budget" value={formatBudget(c.budget_min_kes, c.budget_max_kes)} />
          <Row label="Locations" value={list(c.preferred_locations)} />
          <Row label="Property type" value={c.property_type} />
          <Row label="Timeline" value={c.timeline} />
          <Row label="Financing" value={c.financing} />
          <Row label="Objections" value={list(c.objections)} />
          <Row label="Deal stage" value={stageLabel(c.deal_stage)} />
          <Row label="Next step" value={c.next_step} />
        </dl>
      </section>

      <section className="card">
        <div className="mb-3 flex gap-2">
          {(["wa", "email"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${tab === t ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>
              {t === "wa" ? "WhatsApp" : "Email"}
            </button>
          ))}
        </div>
        {tab === "wa" ? (
          <div className="space-y-3">
            {onWhatsappChange ? (
              <textarea className="input min-h-36" value={f.whatsapp} onChange={(e) => onWhatsappChange(e.target.value)} />
            ) : <p className="whitespace-pre-wrap text-sm">{f.whatsapp}</p>}
            <div className="flex flex-wrap gap-2">
              <Copy text={f.whatsapp} />
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn !w-auto">Open in WhatsApp</a>
            </div>
            {!num && <p className="text-xs text-slate-500">No valid phone number found, so WhatsApp will ask you to pick a contact.</p>}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm"><span className="text-slate-500">Subject: </span><span className="font-medium">{f.email_subject}</span></p>
            <p className="whitespace-pre-wrap text-sm">{f.email_body}</p>
            <Copy text={`Subject: ${f.email_subject}\n\n${f.email_body}`} label="Copy email" />
          </div>
        )}
      </section>
    </div>
  );
}
