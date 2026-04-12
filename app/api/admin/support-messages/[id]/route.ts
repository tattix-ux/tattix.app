import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { isAdminEmail } from "@/lib/access";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<unknown> },
) {
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

  const { id } = (await params) as { id: string };
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("artist_support_messages")
    .update({ replied_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  revalidatePath("/dashboard/messages");
  return NextResponse.json({ message: "Message marked as replied." });
}
