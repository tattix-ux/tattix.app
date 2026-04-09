"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookImage,
  CircleDollarSign,
  MessageSquareText,
  PaintbrushVertical,
  Settings2,
  UserRound,
} from "lucide-react";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard/funnel", label: "Funnel Settings", icon: Settings2 },
  { href: "/dashboard/pricing", label: "Pricing", icon: CircleDollarSign },
  { href: "/dashboard/designs", label: "Featured Designs", icon: BookImage },
  { href: "/dashboard/customize", label: "Customize Page", icon: PaintbrushVertical },
  { href: "/dashboard/leads", label: "Leads", icon: MessageSquareText },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-w-fit items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition",
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
