import { createClient } from "@supabase/supabase-js";
// Service role: server-only. Bypasses RLS. Never import in client components.
export const createAdminClient = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
