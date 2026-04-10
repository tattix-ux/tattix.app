import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNext(value: string | null) {
  if (!value || !value.startsWith("/")) {
    return "/dashboard/profile";
  }

  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const errorDescription = url.searchParams.get("error_description");
  const next = getSafeNext(url.searchParams.get("next"));

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  if (errorDescription) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set("message", errorDescription);
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createSupabaseServerClient();

  try {
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
      return NextResponse.redirect(new URL(next, url.origin));
    }

    if (tokenHash && type) {
      await supabase.auth.verifyOtp({
        type: type as EmailOtpType,
        token_hash: tokenHash,
      });

      const destination = type === "recovery" ? "/update-password" : next;
      return NextResponse.redirect(new URL(destination, url.origin));
    }
  } catch (error) {
    const loginUrl = new URL("/login", url.origin);
    loginUrl.searchParams.set(
      "message",
      error instanceof Error ? error.message : "Authentication link is invalid or expired.",
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
