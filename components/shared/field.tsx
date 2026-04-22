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
    <label className={cn("flex flex-col gap-1.5 xl:gap-1", className)}>
      <span className="text-[12.5px] font-medium text-[var(--text-primary)] xl:text-[12px]">{label}</span>
      {description ? (
        <span className="text-[11px] leading-4 text-[var(--text-muted)] xl:text-[11px] xl:leading-[1.35]">{description}</span>
      ) : null}
      {children}
      {error ? <span className="text-[11px] text-red-300">{error}</span> : null}
    </label>
  );
}
