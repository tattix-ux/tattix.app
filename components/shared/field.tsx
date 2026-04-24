import { cn } from "@/lib/utils";

export function Field({
  label,
  description,
  error,
  children,
  className,
}: {
  label: React.ReactNode;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1.5 xl:gap-[3px]", className)}>
      <span className="text-[12.5px] font-medium text-[var(--text-primary)] xl:text-[11.5px]">{label}</span>
      {description ? (
        <span className="text-[11px] leading-4 text-[var(--text-muted)] xl:text-[10.5px] xl:leading-[1.3]">{description}</span>
      ) : null}
      {children}
      {error ? <span className="text-[10.5px] text-red-300">{error}</span> : null}
    </label>
  );
}
