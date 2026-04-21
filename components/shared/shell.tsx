import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative min-h-screen w-full max-w-full overflow-x-hidden overflow-y-visible bg-[var(--background)] text-[var(--foreground)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(214,165,116,0.08),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(141,91,52,0.06),_transparent_24%),linear-gradient(180deg,_#17181C_0%,_#121315_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.018),transparent_18%,transparent_78%,rgba(214,165,116,0.018))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(42,45,52,0.24),_transparent_34%),radial-gradient(circle_at_top,_rgba(255,255,255,0.018),_transparent_28%)] opacity-90" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140' viewBox='0 0 140 140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.7'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative w-full min-w-0 max-w-full overflow-visible">{children}</div>
    </div>
  );
}

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full min-w-0 max-w-full overflow-x-clip px-4 sm:max-w-7xl sm:px-6", className)}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("space-y-4", align === "center" && "text-center")}>
      {eyebrow ? (
        <p className="text-xs font-medium uppercase tracking-[0.36em] text-[var(--accent-soft)]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">{title}</h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
