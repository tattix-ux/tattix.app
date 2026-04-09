"use client";

import { createBrowserClient } from "@supabase/ssr";

import { assertSupabaseEnv } from "@/lib/supabase/env";

export function createSupabaseBrowserClient() {
  assertSupabaseEnv();

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
