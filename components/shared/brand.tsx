import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

const BRAND_PRIMARY_SRC = "/brand/tattix-primary-logo.png";
const BRAND_ICON_SRC = "/brand/tattix-mark-icon.png";
const BRAND_MONOGRAM_SRC = "/brand/tattix-monogram.png";

function getIconSizeClass(size: "sm" | "md" | "lg" | "xl") {
  switch (size) {
    case "sm":
      return "size-9 rounded-[14px]";
    case "md":
      return "size-11 rounded-[16px]";
    case "lg":
      return "size-14 rounded-[20px]";
    case "xl":
      return "size-[4.25rem] rounded-[22px]";
    default:
      return "size-11 rounded-[16px]";
  }
}

export function BrandIcon({
  className,
  size = "md",
  withStage = true,
  priority = false,
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  withStage?: boolean;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative isolate shrink-0 overflow-hidden",
        withStage
          ? "border border-[rgba(214,165,116,0.14)] bg-[linear-gradient(180deg,rgba(32,34,40,0.98),rgba(18,19,23,1))] shadow-[0_10px_24px_rgba(0,0,0,0.24)]"
          : "bg-transparent shadow-none border-0",
        getIconSizeClass(size),
        className,
      )}
    >
      <Image
        src={BRAND_ICON_SRC}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 768px) 44px, 56px"
        className={cn("object-cover opacity-[0.97]", withStage ? "scale-[1.02]" : "scale-100")}
      />
      {withStage ? (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(214,165,116,0.1),transparent_48%)]" />
          <div className="absolute inset-[1px] rounded-[inherit] border border-white/[0.03]" />
        </>
      ) : null}
    </div>
  );
}

export function BrandWordmark({
  className,
  subtitle,
  size = "md",
}: {
  className?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div
        className={cn(
          "font-display uppercase text-[var(--text-primary)]",
          size === "sm" && "text-[0.95rem] tracking-[0.34em]",
          size === "md" && "text-[1.08rem] tracking-[0.42em]",
          size === "lg" && "text-[1.34rem] tracking-[0.46em]",
        )}
      >
        Tattix
      </div>
      {subtitle ? (
        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[var(--text-dim)]">
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

export function BrandLockup({
  className,
  href = "/",
  iconOnlyOnMobile = true,
  subtitle,
  iconSize = "md",
  wordmarkSize = "md",
}: {
  className?: string;
  href?: string;
  iconOnlyOnMobile?: boolean;
  subtitle?: string;
  iconSize?: "sm" | "md" | "lg" | "xl";
  wordmarkSize?: "sm" | "md" | "lg";
}) {
  const content = (
    <>
      <BrandIcon size={iconSize} />
      <BrandWordmark
        subtitle={subtitle}
        size={wordmarkSize}
        className={iconOnlyOnMobile ? "hidden sm:block" : undefined}
      />
      {iconOnlyOnMobile ? <span className="sr-only">Tattix</span> : null}
    </>
  );

  return (
    <Link href={href} className={cn("inline-flex items-center gap-3.5", className)} aria-label="Tattix">
      {content}
    </Link>
  );
}

export function BrandPrimary({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative isolate aspect-square overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_50%_18%,rgba(214,165,116,0.08),transparent_42%),linear-gradient(180deg,rgba(29,31,36,0.92),rgba(18,19,21,0.98))]",
        className,
      )}
    >
      <Image
        src={BRAND_PRIMARY_SRC}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 768px) 220px, 340px"
        className="object-contain p-[8%] opacity-[0.97]"
      />
    </div>
  );
}

export function BrandMonogram({
  className,
  opacity = 0.08,
  blur = 0,
}: {
  className?: string;
  opacity?: number;
  blur?: number;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 select-none", className)}
      style={{ opacity, filter: blur ? `blur(${blur}px)` : undefined }}
      aria-hidden="true"
    >
      <Image
        src={BRAND_MONOGRAM_SRC}
        alt=""
        fill
        sizes="(max-width: 768px) 280px, 480px"
        className="object-contain"
      />
    </div>
  );
}

export const BrandIconSmall = BrandIcon;
export const BrandIconLarge = BrandPrimary;
