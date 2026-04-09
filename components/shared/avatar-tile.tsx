import { initialsFromName } from "@/lib/utils";

export function AvatarTile({
  name,
  imageUrl,
  size = "md",
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "size-12 text-sm",
    md: "size-16 text-lg",
    lg: "size-24 text-3xl",
  };

  if (imageUrl) {
    return (
      <div
        className={`${sizes[size]} overflow-hidden rounded-[28px] border border-white/10 bg-black/30`}
        style={{
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} inline-flex items-center justify-center rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(247,177,93,0.28),rgba(255,255,255,0.08))] font-display text-[var(--accent-soft)]`}
    >
      {initialsFromName(name)}
    </div>
  );
}
