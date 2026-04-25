import { Crown } from "lucide-react";
import { initialsFromName } from "@/lib/utils";

export function AvatarTile({
  name,
  imageUrl,
  size = "md",
  planType,
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  planType?: "free" | "pro" | null;
}) {
  const sizes = {
    sm: "size-12 text-sm",
    md: "size-16 text-lg",
    lg: "size-24 text-3xl",
  };

  const badgeSize = size === "lg" ? "px-2.5 py-1 text-[11px]" : "px-2 py-0.5 text-[10px]";
  const badgePosition = size === "lg" ? "-bottom-1 -right-1" : "-bottom-1 -right-1";

  return (
    <div className="relative inline-flex">
      {imageUrl ? (
        <div
          className={`${sizes[size]} overflow-hidden rounded-[28px] border border-white/10 bg-black/30`}
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : (
        <div
          className={`${sizes[size]} inline-flex items-center justify-center rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(247,177,93,0.28),rgba(255,255,255,0.08))] font-display text-[var(--accent-soft)]`}
        >
          {initialsFromName(name)}
        </div>
      )}
      {planType ? (
        <div
          className={`absolute ${badgePosition} inline-flex items-center gap-1 rounded-full border shadow-lg ${badgeSize}`}
          style={{
            borderColor: "color-mix(in srgb, var(--artist-primary) 44%, transparent)",
            background:
              planType === "pro"
                ? "linear-gradient(180deg, color-mix(in srgb, var(--artist-primary) 34%, rgba(9,9,11,0.95)), rgba(9,9,11,0.94))"
                : "linear-gradient(180deg, color-mix(in srgb, var(--artist-secondary) 28%, rgba(9,9,11,0.95)), rgba(9,9,11,0.94))",
            color: planType === "pro" ? "var(--artist-chip-text)" : "var(--artist-card-text)",
          }}
        >
          {planType === "pro" ? (
            <Crown className="size-3 text-[var(--accent-soft)]" />
          ) : (
            <span className="font-medium uppercase tracking-[0.14em]">Free</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
