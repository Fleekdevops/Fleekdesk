import Anthropic from "@anthropic-ai/sdk";
import { AnalysisSchema, analysisJsonSchema, type AnalysisResult, type Lang } from "./schema";
import { SYSTEM, userMessage } from "./prompt";

/**
 * Provider switch:
 *  - default (LLM_PROVIDER unset): Anthropic, forced tool call
 *  - LLM_PROVIDER=openai-compatible: any OpenAI-style endpoint (Gemini, Groq, OpenRouter...)
 *    needs LLM_BASE_URL, LLM_API_KEY, LLM_MODEL
 */
async function callAnthropic(transcript: string, lang: Lang, today: string, fix: unknown): Promise<unknown> {
  const anthropic = new Anthropic();
  const msg = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5",
    max_tokens: 3000,
    system: SYSTEM,
    tools: [{
      name: "submit_analysis",
      description: "Submit the structured analysis of the transcript.",
      input_schema: analysisJsonSchema() as Anthropic.Messages.Tool["input_schema"],
    }],
    tool_choice: { type: "tool", name: "submit_analysis" },
    messages: [{ role: "user", content: userMessage(transcript, lang, today, fix) }],
  });
  const block = msg.content.find((b) => b.type === "tool_use");
  return block && block.type === "tool_use" ? block.input : null;
}

async function callOpenAICompatible(transcript: string, lang: Lang, today: string, fix: unknown): Promise<unknown> {
  const base = process.env.LLM_BASE_URL, key = process.env.LLM_API_KEY, model = process.env.LLM_MODEL;
  if (!base || !key || !model) throw new Error("LLM_BASE_URL, LLM_API_KEY and LLM_MODEL must be set");
  const models = [model, process.env.LLM_FALLBACK_MODEL].filter(Boolean) as string[];
  const system =
    SYSTEM.replace("Respond ONLY by calling submit_analysis. No other text.",
      "Respond ONLY with one JSON object that matches the JSON schema below. No markdown, no commentary.") +
    "\n\nJSON SCHEMA:\n" + JSON.stringify(analysisJsonSchema());

  const deadline = Date.now() + 45_000; // total budget, stays under the 60s route limit
  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  let lastStatus = 0;

  for (const m of models) {
    for (let i = 0; i < 2; i++) {
      const remaining = deadline - Date.now();
      if (remaining < 4000) throw new Error("LLM time budget used up");
      try {
        const r = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          signal: AbortSignal.timeout(Math.min(25_000, remaining)),
          body: JSON.stringify({
            model: m, temperature: 0.2, response_format: { type: "json_object" },
            messages: [{ role: "system", content: system }, { role: "user", content: userMessage(transcript, lang, today, fix) }],
          }),
        });
        if (r.ok) {
          const j = await r.json();
          const text: string = j.choices?.[0]?.message?.content ?? "";
          try { return JSON.parse(text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "").trim()); } catch { return null; }
        }
        lastStatus = r.status;
        if (![429, 500, 502, 503, 504].includes(r.status)) {
          throw new Error(`LLM HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
        }
      } catch (e) {
        if (e instanceof Error && e.message.startsWith("LLM HTTP")) throw e;
        lastStatus = 0; // timeout or network error: try again
      }
      await sleep(1500 * (i + 1));
    }
  }
  throw new Error(`LLM unavailable (last status ${lastStatus})`);
}

export async function runAnalysis(transcript: string, lang: Lang): Promise<AnalysisResult> {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Nairobi" });
  const call = process.env.LLM_PROVIDER === "openai-compatible" ? callOpenAICompatible : callAnthropic;
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await call(transcript, lang, today, lastErr);
    const parsed = AnalysisSchema.safeParse(raw);
    if (parsed.success) return guard(parsed.data, transcript);
    lastErr = raw == null
      ? "no valid JSON returned"
      : parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  }
  throw new Error("Invalid model output: " + String(lastErr));
}

/** Anti-hallucination: drop name/phone the transcript doesn't contain. Conservative by design. */
function guard(a: AnalysisResult, transcript: string): AnalysisResult {
  const t = transcript.toLowerCase();
  const digits = transcript.replace(/\D/g, "");
  const c = { ...a.client };
  if (c.phone) {
    const d = c.phone.replace(/\D/g, "");
    if (d.length < 9 || !digits.includes(d.slice(-9))) c.phone = null;
  }
  if (c.name) {
    const first = c.name.trim().split(/\s+/)[0]?.toLowerCase();
    if (!first || !t.includes(first)) c.name = null;
  }
  return { ...a, client: c };
}
