import { cn } from "@/lib/utils";
import type { ArtistPageTheme } from "@/lib/types";
import { buildThemeStyles } from "@/lib/theme";

export function ArtistPageShell({
  theme,
  children,
  className,
}: {
  theme: ArtistPageTheme;
  children: React.ReactNode;
  className?: string;
}) {
  const { wrapperStyle } = buildThemeStyles(theme);

  return (
    <div
      className={cn(
        "relative min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--artist-background)] text-[var(--artist-foreground)]",
        className,
      )}
      style={wrapperStyle}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.22),transparent_35%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_20%,transparent_80%,rgba(0,0,0,0.08))]" />
      <div className="relative w-full max-w-full overflow-x-hidden">{children}</div>
    </div>
  );
}
