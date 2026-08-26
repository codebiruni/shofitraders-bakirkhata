import { cn } from "@/lib/cn";
import { formatBDT } from "@/lib/format";

interface Props {
  label: string;
  value: number | string;
  /** When true, displays value as currency. Default: true. */
  asCurrency?: boolean;
  /** When true, applies the prominent "outstanding" treatment. */
  prominent?: boolean;
  hint?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  asCurrency = true,
  prominent = false,
  hint,
  className,
}: Props) {
  const display = typeof value === "number" && asCurrency ? formatBDT(value) : value;
  return (
    <div
      className={cn(
        "ledger-card p-5",
        prominent && "ledger-card-prominent",
        className
      )}
    >
      <p
        className={cn(
          "text-[11px] font-medium",
          prominent ? "text-primary-content" : "text-ink-soft"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold md:text-3xl",
          prominent ? "text-primary-content" : "text-ink"
        )}
      >
        {display}
      </p>
      {hint && (
        <p
          className={cn(
            "mt-1 text-xs",
            prominent ? "text-primary-content/90" : "text-ink-soft"
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
