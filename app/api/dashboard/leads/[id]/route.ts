import { NextResponse } from "next/server";

import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LeadStatus } from "@/lib/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await request.json()) as {
    status?: LeadStatus;
  };

  if (
    body.status !== "new" &&
    body.status !== "contacted" &&
    body.status !== "sold" &&
    body.status !== "lost"
  ) {
    return NextResponse.json({ message: "Invalid lead payload." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      message: "Demo mode active. Connect Supabase to persist lead updates.",
    });
  }

  const artist = await getAuthenticatedArtist();

  if (!artist) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const derivedPayload: Record<string, boolean | string | null> = {
    status: body.status,
    contacted: body.status === "contacted" || body.status === "sold",
    converted_to_sale: body.status === "sold",
    sold_at: body.status === "sold" ? new Date().toISOString() : null,
  };

  let { error } = await supabase
    .from("client_submissions")
    .update(derivedPayload)
    .eq("id", id)
    .eq("artist_id", artist.id);

  if (error && error.message.toLowerCase().includes("status")) {
    const fallbackPayload = {
      contacted: derivedPayload.contacted,
      converted_to_sale: derivedPayload.converted_to_sale,
      sold_at: derivedPayload.sold_at,
    };

    ({ error } = await supabase
      .from("client_submissions")
      .update(fallbackPayload)
      .eq("id", id)
      .eq("artist_id", artist.id));
  }

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: "Lead updated." });
}
