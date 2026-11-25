import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FREE_LIMIT } from "@/lib/constants";
import { isAdminEmail, isPro } from "@/lib/plan";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("plan,pro_until,analyses_used").eq("id", user.id).single();
  const pro = isPro(profile);
  const left = Math.max(0, FREE_LIMIT - (profile?.analyses_used ?? 0));
  const links = [["/analyze", "Analyze"], ["/clients", "Clients"], ["/account", "Account"], ...(isAdminEmail(user.email) ? [["/admin", "Admin"]] : [])];

  return (
    <div className="mx-auto min-h-screen max-w-xl pb-24">
      <header className="flex items-center justify-between px-4 py-3">
        <span className="text-lg font-bold">Fleek<span className="text-emerald-600">Desk</span></span>
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium">{pro ? "Pro" : `${left} free left`}</span>
      </header>
      <main className="px-4">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-xl">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="flex-1 py-3 text-center text-sm font-medium text-slate-700 active:bg-slate-100">{label}</Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
