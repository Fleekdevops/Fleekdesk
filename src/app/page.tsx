import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/analyze");
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-6 px-5 py-10">
      <h1 className="text-4xl font-bold tracking-tight">Fleek<span className="text-emerald-600">Desk</span></h1>
      <p className="text-lg text-slate-600">
        Paste a call or WhatsApp voice-note transcript (English, Kiswahili or Sheng). Get a summary, action items,
        client details and a ready-to-send follow-up in seconds.
      </p>
      <ul className="space-y-2 text-slate-700">
        <li>✓ Budget, locations, financing (cash / mortgage / SACCO), objections</li>
        <li>✓ WhatsApp and email follow-ups in the language you choose</li>
        <li>✓ Searchable client list · 5 free analyses</li>
      </ul>
      <div className="flex gap-3">
        <Link href="/login" className="btn">Get started</Link>
        <Link href="/privacy" className="btn-ghost">Privacy</Link>
      </div>
    </main>
  );
}
