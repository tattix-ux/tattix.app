import { NextResponse } from "next/server";
import { z } from "zod";

import { isAdminEmail } from "@/lib/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
  slug: z.string().trim().min(1),
  planType: z.enum(["free", "pro"]),
  accessStatus: z.enum(["active", "pending", "blocked"]),
});

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: "Demo mode active." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid access payload." }, { status: 400 });
  }

  try {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("artists")
      .update({
        plan_type: parsed.data.planType,
        access_status: parsed.data.accessStatus,
      })
      .eq("slug", parsed.data.slug)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ message: "Artist not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Access updated." });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Unable to update access.",
      },
      { status: 500 },
    );
  }
}
