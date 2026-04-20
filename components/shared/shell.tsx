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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(247,177,93,0.16),_transparent_26%),radial-gradient(circle_at_top,_rgba(255,236,214,0.035),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(122,78,50,0.28),_transparent_38%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,244,228,0.03),transparent_18%,transparent_78%,rgba(247,177,93,0.03))]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[22rem] bg-[linear-gradient(180deg,rgba(255,242,225,0.03),rgba(255,242,225,0.012)_35%,transparent)] opacity-80" />
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
