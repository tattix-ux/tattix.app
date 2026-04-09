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
        "relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(247,177,93,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(87,58,36,0.4),_transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_25%,transparent_75%,rgba(255,255,255,0.02))]" />
      <div className="relative">{children}</div>
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
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6", className)}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
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
      <h2 className="font-display text-3xl leading-tight text-white sm:text-4xl">{title}</h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-7 text-[var(--foreground-muted)] sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}
