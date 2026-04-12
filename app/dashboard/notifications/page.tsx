import { unstable_noStore as noStore } from "next/cache";

import { NotificationsTable } from "@/components/dashboard/notifications-table";
import { SectionHeading } from "@/components/shared/shell";
import { getAuthenticatedArtist } from "@/lib/data/dashboard";
import { getArtistNotifications } from "@/lib/support";

export default async function DashboardNotificationsPage() {
  noStore();

  const artist = await getAuthenticatedArtist();
  const locale = "tr";
  const notifications = artist ? await getArtistNotifications(artist.id) : [];

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow={locale === "tr" ? "Bildirimler" : "Notifications"}
        title={locale === "tr" ? "Yanıtları ve güncellemeleri burada gör." : "See replies and updates here."}
        description={
          locale === "tr"
            ? "Admin yanıtları ve ileride paylaşılacak duyurular bu alanda toplanır."
            : "Admin replies and future updates will appear here."
        }
      />
      <NotificationsTable notifications={notifications} locale={locale} />
    </div>
  );
}
