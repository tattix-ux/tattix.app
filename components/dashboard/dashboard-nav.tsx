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
  pro?: boolean;
  unreadCount?: number;
};

function getItems(locale: "en" | "tr"): DashboardNavItem[] {
  return [
    { href: "/dashboard/profile", label: locale === "tr" ? "Profil" : "Profile", icon: UserRound },
    { href: "/dashboard/pricing", label: locale === "tr" ? "Fiyatlama" : "Pricing", icon: CircleDollarSign },
    {
      href: "/dashboard/designs",
      label: locale === "tr" ? "Tasarımlar" : "Designs",
      icon: BookImage,
      pro: true,
    },
    {
      href: "/dashboard/customize",
      label: locale === "tr" ? "Sayfayı Özelleştir" : "Customize Page",
      icon: PaintbrushVertical,
      pro: true,
    },
    { href: "/dashboard/leads", label: locale === "tr" ? "Talepler" : "Requests", icon: MessageSquareText, pro: true },
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
        unreadCount: adminUnreadCount,
      });
    }

    return base;
  }, [adminUnreadCount, locale, showAdminMessages]);

  return (
    <nav className="grid grid-cols-3 gap-2.5 pb-2 lg:flex lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-[18px] border px-2 py-3 text-center text-[11px] leading-4 transition sm:px-3 sm:text-xs lg:min-w-fit lg:flex-row lg:justify-start lg:gap-2.5 lg:px-3 lg:py-3 lg:text-sm lg:text-left",
              active
                ? "border-[rgba(214,165,116,0.2)] bg-[linear-gradient(180deg,rgba(214,165,116,0.16)_0%,rgba(182,124,73,0.1)_100%)] text-[#F0E4D2] shadow-[0_0_0_1px_rgba(214,165,116,0.1),0_8px_30px_rgba(214,165,116,0.12)]"
                : "border-transparent bg-transparent text-[var(--text-secondary)] hover:border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.03)] hover:text-[var(--text-primary)]",
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
    </nav>
  );
}
