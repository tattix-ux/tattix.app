"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
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

  useEffect(() => {
    items.forEach((item) => router.prefetch(item.href));
  }, [items, router]);

  return (
    <nav className="grid grid-cols-3 gap-2.5 pb-2 lg:flex lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={cn(
              "inline-flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-[18px] border px-2 py-3 text-center text-[11px] leading-4 transition sm:px-3 sm:text-xs lg:min-w-fit lg:flex-row lg:justify-start lg:gap-2.5 lg:px-3 lg:py-3 lg:text-sm lg:text-left",
              active
                ? "border-[var(--accent)]/38 bg-[linear-gradient(180deg,rgba(247,177,93,0.18),rgba(247,177,93,0.1))] text-white shadow-[0_16px_28px_rgba(0,0,0,0.18)]"
                : "border-white/7 bg-[color:color-mix(in_srgb,var(--background)_72%,white_6%)] text-[color:color-mix(in_srgb,var(--foreground-muted)_88%,white_8%)] hover:border-white/12 hover:bg-[color:color-mix(in_srgb,var(--background)_64%,white_9%)] hover:text-white",
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
