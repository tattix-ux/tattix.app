import { cn } from "@/lib/utils";

export function Field({
  label,
  description,
  error,
  children,
  className,
}: {
  label: string;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-[12.5px] font-medium text-[var(--text-primary)]">{label}</span>
      {description ? (
        <span className="text-[11px] leading-4 text-[var(--text-muted)]">{description}</span>
      ) : null}
      {children}
      {error ? <span className="text-[11px] text-red-300">{error}</span> : null}
    </label>
  );
}
