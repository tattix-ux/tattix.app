"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookImage,
  CircleDollarSign,
  MessageSquareText,
  PaintbrushVertical,
  Settings2,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

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
      label: locale === "tr" ? "Tasarım Kartları" : "Featured Designs",
      icon: BookImage,
    },
    {
      href: "/dashboard/customize",
      label: locale === "tr" ? "Sayfayı Özelleştir" : "Customize Page",
      icon: PaintbrushVertical,
    },
    { href: "/dashboard/leads", label: locale === "tr" ? "Talepler" : "Leads", icon: MessageSquareText },
  ];
}

export function DashboardNav({ locale = "en" }: { locale?: "en" | "tr" }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = useMemo(() => getItems(locale), [locale]);

  useEffect(() => {
    items.forEach((item) => router.prefetch(item.href));
  }, [items, router]);

  return (
    <nav className="flex gap-2 overflow-x-auto pb-2 xl:flex-col xl:overflow-visible">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            className={cn(
              "inline-flex min-w-fit items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition whitespace-nowrap",
              active
                ? "border-[var(--accent)]/30 bg-[var(--accent)]/14 text-white"
                : "border-white/8 bg-white/3 text-[var(--foreground-muted)] hover:border-white/12 hover:bg-white/6 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
