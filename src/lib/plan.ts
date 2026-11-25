export function isPro(p: { plan: string; pro_until: string | null } | null | undefined) {
  return !!p && p.plan === "pro" && (!p.pro_until || new Date(p.pro_until) > new Date());
}
export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
}
