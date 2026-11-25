"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AccountActions() {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/"); router.refresh();
  }
  async function del() {
    setBusy(true); setErr(null);
    const r = await fetch("/api/account/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm }) });
    if (!r.ok) { setErr("Could not delete. Try again or email us."); setBusy(false); return; }
    await createClient().auth.signOut();
    router.replace("/"); router.refresh();
  }

  return (
    <div className="space-y-4">
      <button className="btn-ghost w-full" onClick={signOut}>Sign out</button>
      <a href="/api/account/export" className="btn-ghost w-full">Download my data (JSON)</a>
      <div className="card space-y-3 border-red-200">
        <h2 className="font-semibold text-red-700">Delete my data</h2>
        <p className="text-sm text-slate-600">Permanently deletes your account and every saved client record. This cannot be undone. Type <b>DELETE</b> to confirm.</p>
        <input className="input" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn !bg-red-600" disabled={confirm !== "DELETE" || busy} onClick={del}>{busy ? "Deleting…" : "Delete everything"}</button>
      </div>
    </div>
  );
}
