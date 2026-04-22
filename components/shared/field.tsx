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
    <label className={cn("flex flex-col gap-2", className)}>
      <span className="text-[13px] font-medium text-[var(--text-primary)]">{label}</span>
      {description ? (
        <span className="text-[11px] leading-[1.35rem] text-[var(--text-muted)]">{description}</span>
      ) : null}
      {children}
      {error ? <span className="text-[11px] text-red-300">{error}</span> : null}
    </label>
  );
}
