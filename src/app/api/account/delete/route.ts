import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (body?.confirm !== "DELETE") return NextResponse.json({ error: "Confirmation missing." }, { status: 400 });

  const admin = createAdminClient();
  await admin.from("clients").delete().eq("user_id", user.id);
  const { error } = await admin.auth.admin.deleteUser(user.id); // cascades to profiles
  if (error) return NextResponse.json({ error: "Deletion failed." }, { status: 500 });
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
