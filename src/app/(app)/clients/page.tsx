import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatBudget, stageLabel } from "@/lib/format";

export default async function Clients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const supabase = await createClient();
  let query = supabase.from("clients")
    .select("id,name,phone,budget_min_kes,budget_max_kes,locations,deal_stage,created_at")
    .order("created_at", { ascending: false }).limit(100);

  const term = q.replace(/[^\p{L}\p{N}\s+-]/gu, "").trim();
  if (term) {
    const variants = [term, ...(/^0\d+$/.test(term) ? [term.slice(1)] : [])];
    query = query.or(variants.map((v) => `search_text.ilike.%${v}%`).join(","));
  }
  const { data: clients } = await query;

  return (
    <>
      <h1 className="mb-3 text-xl font-bold">Clients</h1>
      <form className="mb-4 flex gap-2">
        <input name="q" defaultValue={q} className="input" placeholder="Search name, phone, area, type…" />
        <button className="btn-ghost">Search</button>
      </form>
      {!clients?.length ? (
        <p className="text-sm text-slate-500">{term ? "No matches." : "No clients yet. Analyze a transcript and save it."}</p>
      ) : (
        <ul className="space-y-3">
          {clients.map((c) => (
            <li key={c.id}>
              <Link href={`/clients/${c.id}`} className="card block active:bg-slate-50">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{c.name ?? "Unnamed lead"}</p>
                  {c.deal_stage && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">{stageLabel(c.deal_stage)}</span>}
                </div>
                <p className="text-sm text-slate-500">{c.phone ?? "No phone"}</p>
                <p className="mt-1 text-sm">{[formatBudget(c.budget_min_kes, c.budget_max_kes), c.locations?.join(", ")].filter(Boolean).join(" · ") || "—"}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
