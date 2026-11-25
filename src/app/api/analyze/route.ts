import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runAnalysis } from "@/lib/analyze";
import { LANGS } from "@/lib/schema";
import { MAX_TRANSCRIPT } from "@/lib/constants";

export const maxDuration = 60;
const Body = z.object({
  transcript: z.string().min(20).max(MAX_TRANSCRIPT),
  language: z.enum(LANGS),
  consent: z.literal(true),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: `Paste a transcript (20–${MAX_TRANSCRIPT} characters) and tick the consent box.` }, { status: 400 });

  const { data: allowed, error } = await supabase.rpc("consume_analysis");
  if (error) return NextResponse.json({ error: "Could not check your plan." }, { status: 500 });
  if (!allowed) {
    return NextResponse.json({
      error: `You have used your 5 free analyses. ${process.env.PAYMENT_INSTRUCTIONS ?? ""}`.trim(),
      code: "LIMIT",
    }, { status: 402 });
  }

  try {
    const analysis = await runAnalysis(body.data.transcript, body.data.language);
    return NextResponse.json({ analysis });
  } catch (e) {
    await supabase.rpc("refund_analysis");
    console.error("analysis failed", e instanceof Error ? e.message : "unknown"); // never log transcripts
    return NextResponse.json({ error: "The AI could not produce a valid result. Your credit was not used. Please try again." }, { status: 502 });
  }
}
