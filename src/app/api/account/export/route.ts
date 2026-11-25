import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const [{ data: profile }, { data: clients }] = await Promise.all([
    supabase.from("profiles").select("email,plan,pro_until,analyses_used,consented_at,created_at").eq("id", user.id).single(),
    supabase.from("clients").select("*").eq("user_id", user.id),
  ]);
  return new NextResponse(JSON.stringify({ exported_at: new Date().toISOString(), profile, clients }, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="fleekdesk-my-data.json"' },
  });
}
