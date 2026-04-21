import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

const BRAND_REFERENCE_SRC = "/brand/tattix-brand-reference.png";
const BRAND_ICON_SMALL_SRC = "/brand/tattix-koi-icon-small-source.png";

export function BrandIconLarge({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative isolate aspect-square overflow-hidden rounded-[30px] border border-[rgba(214,165,116,0.16)] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_56%),linear-gradient(180deg,rgba(31,33,39,0.96),rgba(17,18,22,1))] shadow-[0_20px_48px_rgba(0,0,0,0.34)]",
        className,
      )}
    >
      <Image
        src={BRAND_REFERENCE_SRC}
        alt=""
        fill
        priority={priority}
        sizes="(max-width: 768px) 128px, 160px"
        className="object-cover object-[24%_16%] scale-[1.18] opacity-[0.97]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_26%,rgba(214,165,116,0.12),transparent_46%)]" />
      <div className="absolute inset-[1px] rounded-[29px] border border-white/[0.03]" />
    </div>
  );
}

export function BrandIconSmall({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative isolate size-11 shrink-0 overflow-hidden rounded-[16px] border border-[rgba(214,165,116,0.14)] bg-[linear-gradient(180deg,rgba(32,34,40,0.98),rgba(18,19,23,1))] shadow-[0_10px_24px_rgba(0,0,0,0.24)]",
        className,
      )}
    >
      <Image
        src={BRAND_ICON_SMALL_SRC}
        alt=""
        fill
        sizes="44px"
        className="object-cover opacity-[0.96]"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(214,165,116,0.1),transparent_48%)]" />
      <div className="absolute inset-[1px] rounded-[15px] border border-white/[0.03]" />
    </div>
  );
}

export function BrandWordmark({
  className,
  subtitle,
}: {
  className?: string;
  subtitle?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="font-display text-[1.05rem] uppercase tracking-[0.42em] text-[var(--text-primary)]">
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
}: {
  className?: string;
  href?: string;
  iconOnlyOnMobile?: boolean;
  subtitle?: string;
}) {
  const content = (
    <>
      <BrandIconSmall />
      <BrandWordmark
        subtitle={subtitle}
        className={iconOnlyOnMobile ? "hidden sm:block" : undefined}
      />
      {iconOnlyOnMobile ? <span className="sr-only">Tattix</span> : null}
    </>
  );

  return (
    <Link href={href} className={cn("inline-flex items-center gap-3", className)} aria-label="Tattix">
      {content}
    </Link>
  );
}
