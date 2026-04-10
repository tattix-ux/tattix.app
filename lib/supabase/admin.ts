import { createClient } from "@supabase/supabase-js";

import { assertSupabaseEnv } from "@/lib/supabase/env";

export function createSupabaseAdminClient() {
  assertSupabaseEnv();

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
