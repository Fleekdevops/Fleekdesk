import { z } from "zod";

export const LANGS = ["en", "sw", "sheng"] as const;
export type Lang = (typeof LANGS)[number];

export const DEAL_STAGES = [
  "new_lead", "qualified", "viewing_scheduled", "viewed",
  "negotiating", "offer_made", "closed_won", "closed_lost",
] as const;
export const FINANCING = ["cash", "mortgage", "sacco", "other"] as const;

const ActionItem = z.object({
  task: z.string(),
  owner: z.enum(["agent", "client", "other"]).nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
    .describe("ISO date, only if stated or resolvable from the provided today date"),
  due_text: z.string().nullable().describe("The deadline as spoken, e.g. 'kesho', 'Friday'"),
});

const ClientDetails = z.object({
  name: z.string().nullable(),
  phone: z.string().nullable(),
  budget_min_kes: z.number().int().nonnegative().nullable(),
  budget_max_kes: z.number().int().nonnegative().nullable(),
  preferred_locations: z.array(z.string()),
  property_type: z.string().nullable(),
  timeline: z.string().nullable(),
  financing: z.enum(FINANCING).nullable(),
  objections: z.array(z.string()),
  deal_stage: z.enum(DEAL_STAGES).nullable(),
  next_step: z.string().nullable(),
});

export const AnalysisSchema = z.object({
  summary: z.string().describe("3 to 5 sentences"),
  action_items: z.array(ActionItem),
  client: ClientDetails,
  followup: z.object({
    whatsapp: z.string(),
    email_subject: z.string(),
    email_body: z.string(),
  }),
});
export type AnalysisResult = z.infer<typeof AnalysisSchema>;

export function analysisJsonSchema(): Record<string, unknown> {
  const s = z.toJSONSchema(AnalysisSchema) as Record<string, unknown>;
  delete s.$schema;
  return s;
}
