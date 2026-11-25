import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail, isPro } from "@/lib/plan";

export default async function Admin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) notFound();

  const { q = "" } = await searchParams;
  const admin = createAdminClient();
  let query = admin.from("profiles").select("id,email,plan,pro_until,analyses_used,created_at").order("created_at", { ascending: false }).limit(100);
  if (q) query = query.ilike("email", `%${q.replace(/[%,()]/g, "")}%`);
  const { data: users } = await query;

  async function setPlan(fd: FormData) {
    "use server";
    const s = await createClient();
    const { data: { user } } = await s.auth.getUser();
    if (!isAdminEmail(user?.email)) return;
    const id = String(fd.get("id"));
    const intent = String(fd.get("intent"));
    const days = Math.min(Math.max(Number(fd.get("days")) || 30, 1), 366);
    const a = createAdminClient();
    if (intent === "activate") {
      const { data: cur } = await a.from("profiles").select("plan,pro_until").eq("id", id).single();
      const base = cur && isPro(cur) && cur.pro_until ? new Date(cur.pro_until).getTime() : Date.now(); // extend if still active
      await a.from("profiles").update({ plan: "pro", pro_until: new Date(base + days * 864e5).toISOString() }).eq("id", id);
    } else if (intent === "deactivate") {
      await a.from("profiles").update({ plan: "free", pro_until: null }).eq("id", id);
    } else if (intent === "reset") {
      await a.from("profiles").update({ analyses_used: 0 }).eq("id", id);
    }
    revalidatePath("/admin");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Admin · plans</h1>
      <form className="flex gap-2"><input name="q" defaultValue={q} className="input" placeholder="Search email" /><button className="btn-ghost">Go</button></form>
      <ul className="space-y-3">
        {users?.map((u) => (
          <li key={u.id} className="card space-y-2">
            <p className="break-all font-medium">{u.email}</p>
            <p className="text-sm text-slate-500">
              {isPro(u) ? `Pro${u.pro_until ? ` until ${new Date(u.pro_until).toLocaleDateString("en-KE")}` : ""}` : "Free"} · used {u.analyses_used}
            </p>
            <form action={setPlan} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={u.id} />
              <input name="days" type="number" defaultValue={30} min={1} max={366} className="input !w-20 !py-2" aria-label="Days" />
              <button name="intent" value="activate" className="btn !w-auto !py-2">Activate / extend</button>
              <button name="intent" value="deactivate" className="btn-ghost !py-2">Deactivate</button>
              <button name="intent" value="reset" className="btn-ghost !py-2">Reset usage</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
