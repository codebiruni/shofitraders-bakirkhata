import { cn } from "@/lib/cn";

interface Props {
  className?: string;
  count?: number;
}

export function Skeleton({ className, count = 1 }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-4 w-full animate-pulse rounded bg-base-200",
            className
          )}
        />
      ))}
    </>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="ledger-card p-5">
      <div className="h-3 w-20 animate-pulse rounded bg-base-200" />
      <div className="mt-3 h-7 w-32 animate-pulse rounded bg-base-200" />
    </div>
  );
}

export function TableRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-12 w-full animate-pulse rounded-md bg-base-200"
        />
      ))}
    </div>
  );
}
