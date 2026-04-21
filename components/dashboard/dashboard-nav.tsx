"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookImage,
  CircleDollarSign,
  Crown,
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
    <nav className="space-y-4 pb-1">
      {(["primary", "secondary"] as const).map((group, groupIndex) => {
        const groupItems = items.filter((item) => item.group === group);

        if (groupItems.length === 0) {
          return null;
        }

        return (
          <div key={group} className="space-y-3">
            {groupIndex > 0 ? <div className="h-px rounded-full bg-[var(--border-soft)]" /> : null}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:flex lg:flex-col lg:overflow-visible">
              {groupItems.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-[18px] border px-2 py-3 text-center text-[11px] leading-4 transition sm:px-3 sm:text-xs lg:min-w-fit lg:flex-row lg:justify-start lg:gap-2.5 lg:px-3 lg:py-3 lg:text-sm lg:text-left",
              active
                ? "border-[var(--border-strong)] bg-[linear-gradient(180deg,rgba(214,177,122,0.14)_0%,rgba(155,110,69,0.08)_100%)] text-[var(--text-primary)] shadow-[0_0_0_1px_rgba(214,177,122,0.08),0_8px_24px_rgba(0,0,0,0.22)]"
                : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-soft)] hover:bg-[rgba(255,255,255,0.028)] hover:text-[var(--text-primary)]",
            )}
          >
            <Icon className="size-4" />
            <span className="break-words">{item.label}</span>
            {item.pro && !hideProBadges ? (
              <Badge variant="muted" className="gap-1 lg:ml-1">
                <Crown className="size-3" />
                Pro
              </Badge>
            ) : null}
            {item.unreadCount ? (
              <Badge variant="accent" className="lg:ml-1">
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
