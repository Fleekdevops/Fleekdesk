import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnalysisView } from "@/components/AnalysisView";
import type { AnalysisResult } from "@/lib/schema";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("id,name,created_at,analysis").eq("id", id).single();
  if (!data) notFound();

  async function remove() {
    "use server";
    const s = await createClient();
    await s.from("clients").delete().eq("id", id); // RLS limits to own rows
    redirect("/clients");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">{data.name ?? "Unnamed lead"}</h1>
        <p className="text-xs text-slate-500">Saved {new Date(data.created_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}</p>
      </div>
      <AnalysisView analysis={data.analysis as AnalysisResult} />
      <form action={remove}><button className="btn-ghost w-full !text-red-700">Delete this client</button></form>
    </div>
  );
}
