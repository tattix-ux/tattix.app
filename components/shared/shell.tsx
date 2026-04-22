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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(214,177,122,0.07),transparent_24%),radial-gradient(circle_at_88%_12%,rgba(40,46,56,0.06),transparent_22%),linear-gradient(180deg,#101114_0%,#0A0A0B_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.014),transparent_20%,transparent_76%,rgba(214,177,122,0.015))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(28,30,34,0.16),_transparent_32%),radial-gradient(circle_at_top,_rgba(255,255,255,0.012),_transparent_24%)] opacity-90" />
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
  return <div className={cn("mx-auto w-full min-w-0 max-w-full overflow-x-clip px-3.5 sm:max-w-[1400px] sm:px-[18px] lg:px-5", className)}>{children}</div>;
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
    <div className={cn("space-y-2", align === "center" && "text-center")}>
      {eyebrow ? (
        <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-[var(--accent-soft)]/95">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="font-display text-[1.9rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--text-primary)] sm:text-[2.25rem]">{title}</h2>
      {description ? (
        <p className="max-w-2xl text-[13px] leading-5 text-[var(--text-secondary)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
