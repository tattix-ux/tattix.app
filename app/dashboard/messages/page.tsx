import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/access";
import { getAdminSupportMessages } from "@/lib/support";
import { getSupabaseSession } from "@/lib/supabase/server";
import { SectionHeading } from "@/components/shared/shell";
import { SupportMessagesTable } from "@/components/dashboard/support-messages-table";
import { buildPageMetadata } from "@/lib/config/site";

export const metadata: Metadata = buildPageMetadata("/dashboard/messages", { noIndex: true });

export default async function DashboardMessagesPage() {
  noStore();

  const session = await getSupabaseSession();

  if (!session?.user.email || !isAdminEmail(session.user.email)) {
    redirect("/dashboard/profile");
  }

  const messages = await getAdminSupportMessages();

  return (
    <div className="space-y-2.5 xl:space-y-2">
      <SectionHeading
        eyebrow="Mesajlar"
        title="Destek mesajlarını burada yönet."
        description="Kullanıcılardan gelen destek mesajları burada toplanır. Buradan yanıtlayabilir ve takip edebilirsin."
      />
      <SupportMessagesTable messages={messages} />
    </div>
  );
}
