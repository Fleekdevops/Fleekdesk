export function waNumber(phone: string | null): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("254")) { /* ok */ }
  else if (d.startsWith("0")) d = "254" + d.slice(1);
  else if (d.length === 9) d = "254" + d;
  else return null;
  return d.length === 12 ? d : null;
}

const kes = (n: number) => "KES " + n.toLocaleString("en-KE");
export function formatBudget(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return min === max ? kes(min) : `${kes(min)} – ${kes(max)}`;
  if (max != null) return `Up to ${kes(max)}`;
  if (min != null) return `From ${kes(min)}`;
  return null;
}

export const stageLabel = (s: string | null) => (s ? s.replace(/_/g, " ") : null);
