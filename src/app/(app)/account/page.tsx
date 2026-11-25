import { createClient } from "@/lib/supabase/server";
import { AccountActions } from "@/components/AccountActions";
import { FREE_LIMIT } from "@/lib/constants";
import { isPro } from "@/lib/plan";

export default async function Account() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: p } = await supabase.from("profiles").select("plan,pro_until,analyses_used").eq("id", user!.id).single();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Account</h1>
      <div className="card text-sm">
        <p>{user!.email}</p>
        <p className="mt-1 text-slate-600">
          {isPro(p) ? `Pro${p?.pro_until ? ` until ${new Date(p.pro_until).toLocaleDateString("en-KE", { dateStyle: "medium" })}` : ""}`
            : `Free plan · ${p?.analyses_used ?? 0}/${FREE_LIMIT} analyses used`}
        </p>
        {!isPro(p) && <p className="mt-2 text-slate-600">{process.env.PAYMENT_INSTRUCTIONS}</p>}
      </div>
      <AccountActions />
      <p className="text-center text-sm"><a className="underline" href="/privacy">Privacy policy</a></p>
    </div>
  );
}
