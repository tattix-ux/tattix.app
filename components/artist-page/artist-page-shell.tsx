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
  const { wrapperStyle, backgroundMedia } = buildThemeStyles(theme);

  return (
    <div
      className={cn(
        "relative min-h-screen w-full max-w-full overflow-x-hidden overflow-y-visible bg-[var(--artist-background)] text-[var(--artist-foreground)]",
        className,
      )}
      style={wrapperStyle}
    >
      {backgroundMedia.imageUrl ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 scale-[1.04]"
            style={{
              backgroundImage: `url(${backgroundMedia.imageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: backgroundMedia.position,
              filter: `blur(${backgroundMedia.blurPx}px)`,
            }}
          />
          <div className="absolute inset-0" style={{ background: backgroundMedia.overlayGradient }} />
          <div className="absolute inset-0" style={{ backgroundColor: backgroundMedia.overlayColor }} />
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--artist-shell-glow)" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--artist-shell-veil)" }} />
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: `inset 0 0 0 1px ${"var(--artist-page-texture)"}` }} />
      <div className="relative w-full min-w-0 max-w-full overflow-visible">{children}</div>
    </div>
  );
}
