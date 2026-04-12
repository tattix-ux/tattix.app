import Link from "next/link";
import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function DashboardNotificationBell({
  locale,
  unreadCount,
}: {
  locale: "tr" | "en";
  unreadCount: number;
}) {
  return (
    <Link
      href="/dashboard/notifications"
      className="relative inline-flex size-10 items-center justify-center rounded-full border border-white/8 bg-white/4 text-[var(--foreground-muted)] transition hover:border-white/14 hover:bg-white/8 hover:text-white"
      aria-label={locale === "tr" ? "Bildirimler" : "Notifications"}
    >
      <Bell className="size-4" />
      {unreadCount > 0 ? (
        <Badge className="absolute -right-1 -top-1 min-w-5 justify-center px-1.5 py-0 text-[10px]">
          {unreadCount}
        </Badge>
      ) : null}
    </Link>
  );
}
