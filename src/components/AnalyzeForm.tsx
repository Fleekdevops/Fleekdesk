"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisView } from "./AnalysisView";
import { MAX_TRANSCRIPT } from "@/lib/constants";
import type { AnalysisResult, Lang } from "@/lib/schema";

const LANG_OPTIONS: [Lang, string][] = [["en", "English"], ["sw", "Kiswahili"], ["sheng", "Sheng mix"]];

export function AnalyzeForm() {
  const router = useRouter();
  const [transcript, setTranscript] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

    async function analyze(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const r = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(65_000), // give up after 65 seconds
        body: JSON.stringify({ transcript, language: lang, consent }),
      });
      const j = await r.json();
      if (!r.ok) setError(j.error ?? "Something went wrong.");
      else { setResult(j.analysis); window.scrollTo({ top: 0 }); }
    } catch {
      setError("This took too long or the connection dropped. Wait a moment and try again.");
    }
    setLoading(false);
  }

  async function save() {
    if (!result) return;
    setSaving(true); setError(null);
    const r = await fetch("/api/clients", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysis: result, language: lang }),
    });
    const j = await r.json();
    setSaving(false);
    if (!r.ok) return setError(j.error ?? "Could not save.");
    router.push(`/clients/${j.id}`);
  }

  if (result) {
    return (
      <div className="space-y-4">
        <AnalysisView analysis={result} onWhatsappChange={(v) => setResult({ ...result, followup: { ...result.followup, whatsapp: v } })} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="btn" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save to client list"}</button>
          <button className="btn-ghost" onClick={() => { setResult(null); setTranscript(""); setConsent(false); }}>Analyze another</button>
        </div>
        <p className="text-xs text-slate-500">AI can make mistakes. Check names, numbers and amounts before sending anything.</p>
      </div>
    );
  }

  return (
    <form onSubmit={analyze} className="space-y-4">
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <b>Recorded calls:</b> tell the client the call is being recorded and get their consent before you record or process their details here.
      </div>
      <textarea className="input min-h-60" required placeholder="Paste call or voice-note transcript here (English, Kiswahili or Sheng)…"
        maxLength={MAX_TRANSCRIPT} value={transcript} onChange={(e) => setTranscript(e.target.value)} />
      <p className="text-right text-xs text-slate-400">{transcript.length}/{MAX_TRANSCRIPT}</p>
      <div>
        <p className="mb-1 text-sm font-medium">Reply language</p>
        <div className="flex gap-2">
          {LANG_OPTIONS.map(([v, l]) => (
            <button key={v} type="button" onClick={() => setLang(v)}
              className={`flex-1 rounded-xl border px-3 py-3 text-sm font-medium ${lang === v ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white"}`}>{l}</button>
          ))}
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>I confirm the client agreed to the call being recorded/transcribed and to their details being processed with AI tools.</span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="btn" disabled={loading || !consent || transcript.trim().length < 20}>{loading ? "Analyzing… (up to 30s)" : "Analyze"}</button>
    </form>
  );
}
