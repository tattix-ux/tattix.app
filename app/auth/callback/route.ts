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
  const statusUrl = new URL("/auth/status", url.origin);

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  if (errorDescription) {
    statusUrl.searchParams.set("state", "error");
    statusUrl.searchParams.set("message", errorDescription);
    return NextResponse.redirect(statusUrl);
  }

  const supabase = await createSupabaseServerClient();

  try {
    if (code) {
      await supabase.auth.exchangeCodeForSession(code);
      if (next === "/dashboard/profile") {
        statusUrl.searchParams.set("state", "verified");
        statusUrl.searchParams.set("next", next);
        return NextResponse.redirect(statusUrl);
      }

      return NextResponse.redirect(new URL(next, url.origin));
    }

    if (tokenHash && type) {
      await supabase.auth.verifyOtp({
        type: type as EmailOtpType,
        token_hash: tokenHash,
      });

      if (type === "recovery") {
        return NextResponse.redirect(new URL("/update-password", url.origin));
      }

      statusUrl.searchParams.set("state", "verified");
      statusUrl.searchParams.set("next", next);
      return NextResponse.redirect(statusUrl);
    }
  } catch (error) {
    statusUrl.searchParams.set("state", "error");
    statusUrl.searchParams.set(
      "message",
      error instanceof Error ? error.message : "Authentication link is invalid or expired.",
    );
    return NextResponse.redirect(statusUrl);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
