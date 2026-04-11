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
  Settings2,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

function getItems(locale: "en" | "tr") {
  return [
    { href: "/dashboard/profile", label: locale === "tr" ? "Profil" : "Profile", icon: UserRound },
    {
      href: "/dashboard/funnel",
      label: locale === "tr" ? "Akış Ayarları" : "Funnel Settings",
      icon: Settings2,
    },
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
}: {
  locale?: "en" | "tr";
  hideProBadges?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const items = useMemo(() => getItems(locale), [locale]);

  useEffect(() => {
    items.forEach((item) => router.prefetch(item.href));
  }, [items, router]);

  return (
    <nav className="grid grid-cols-3 gap-2 pb-2 xl:flex xl:flex-col xl:overflow-visible">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={cn(
              "inline-flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-2.5 text-center text-[11px] leading-4 transition sm:px-3 sm:text-xs xl:min-w-fit xl:flex-row xl:justify-start xl:gap-2.5 xl:px-4 xl:py-3 xl:text-sm xl:text-left",
              active
                ? "border-[var(--accent)]/30 bg-[var(--accent)]/14 text-white"
                : "border-white/8 bg-white/3 text-[var(--foreground-muted)] hover:border-white/12 hover:bg-white/6 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            <span className="break-words">{item.label}</span>
            {item.pro && !hideProBadges ? (
              <Badge variant="muted" className="gap-1 xl:ml-1">
                <Crown className="size-3" />
                Pro
              </Badge>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
