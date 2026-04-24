"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookImage,
  CircleDollarSign,
  LockKeyhole,
  MessageSquareText,
  PaintbrushVertical,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type DashboardNavItem = {
  href: string;
  label: string;
  icon: typeof UserRound;
  group: "primary" | "secondary";
  pro?: boolean;
  unreadCount?: number;
};

function getItems(locale: "en" | "tr"): DashboardNavItem[] {
  return [
    { href: "/dashboard/profile", label: locale === "tr" ? "Profil" : "Profile", icon: UserRound, group: "primary" },
    { href: "/dashboard/pricing", label: locale === "tr" ? "Fiyatlama" : "Pricing", icon: CircleDollarSign, group: "primary" },
    {
      href: "/dashboard/designs",
      label: locale === "tr" ? "Tasarımlar" : "Designs",
      icon: BookImage,
      group: "primary",
      pro: true,
    },
    {
      href: "/dashboard/customize",
      label: locale === "tr" ? "Sayfayı Özelleştir" : "Customize Page",
      icon: PaintbrushVertical,
      group: "secondary",
      pro: true,
    },
    {
      href: "/dashboard/leads",
      label: locale === "tr" ? "Talepler" : "Requests",
      icon: MessageSquareText,
      group: "secondary",
      pro: true,
    },
  ];
}

export function DashboardNav({
  locale = "en",
  hideProBadges = false,
  showAdminMessages = false,
  adminUnreadCount = 0,
}: {
  locale?: "en" | "tr";
  hideProBadges?: boolean;
  showAdminMessages?: boolean;
  adminUnreadCount?: number;
}) {
  const pathname = usePathname();
  const items = useMemo(() => {
    const base = getItems(locale);

    if (showAdminMessages) {
      base.push({
        href: "/dashboard/messages",
        label: locale === "tr" ? "Mesajlar" : "Messages",
        icon: MessageSquareText,
        group: "secondary",
        unreadCount: adminUnreadCount,
      });
    }

    return base;
  }, [adminUnreadCount, locale, showAdminMessages]);

  return (
    <nav className="space-y-1.5 pb-0.5">
      {(["primary", "secondary"] as const).map((group, groupIndex) => {
        const groupItems = items.filter((item) => item.group === group);

        if (groupItems.length === 0) {
          return null;
        }

        return (
          <div key={group} className="space-y-1">
            {groupIndex > 0 ? <div className="h-px rounded-full bg-[var(--border-soft)]" /> : null}
            <div className="flex flex-col gap-0.5">
              {groupItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-w-0 items-center justify-start gap-1.5 rounded-[12px] border px-2 py-1.5 text-[10.5px] transition xl:min-h-[34px] xl:px-1.5 xl:py-1",
              active
                ? "border-[var(--border-strong)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(214,177,122,0.07)_100%)] text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-soft)] hover:bg-[rgba(255,255,255,0.024)] hover:text-[var(--text-primary)]",
            )}
          >
            <Icon className="size-3" />
            <span className="min-w-0 flex-1 break-words leading-[1.15]">{item.label}</span>
            {item.pro && !hideProBadges ? (
              <span className="ml-auto inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-[var(--text-muted)]">
                <LockKeyhole className="size-2.5" />
              </span>
            ) : null}
            {item.unreadCount ? (
              <Badge variant="accent" className="ml-auto px-1.5 py-0.5 text-[8.5px]">
                {item.unreadCount}
              </Badge>
            ) : null}
          </Link>
        );
      })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
