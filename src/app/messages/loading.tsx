import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <header className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-72" />
      </header>

      <div className="ledger-card space-y-3 p-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-28 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-40" />
        </div>
      </div>

      <TableRowSkeleton rows={6} />
    </div>
  );
}
