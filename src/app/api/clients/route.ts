import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { AnalysisSchema, LANGS } from "@/lib/schema";
import { waNumber } from "@/lib/format";

const Body = z.object({ analysis: AnalysisSchema, language: z.enum(LANGS) });

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data." }, { status: 400 });
  const { analysis: a, language } = parsed.data;
  const c = a.client;

  const search_text = [c.name, c.phone, waNumber(c.phone), c.preferred_locations.join(" "), c.property_type, c.deal_stage?.replace(/_/g, " "), c.financing]
    .filter(Boolean).join(" ").toLowerCase();

  const { data, error } = await supabase.from("clients").insert({
    user_id: user.id, name: c.name, phone: c.phone,
    budget_min_kes: c.budget_min_kes, budget_max_kes: c.budget_max_kes,
    locations: c.preferred_locations, deal_stage: c.deal_stage, next_step: c.next_step,
    language, analysis: a, search_text,
  }).select("id").single();

  if (error) return NextResponse.json({ error: "Could not save." }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
