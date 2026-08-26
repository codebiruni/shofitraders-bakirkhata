import { StatCardSkeleton, Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="space-y-8" aria-busy="true" aria-live="polite">
            <Skeleton className="h-4 w-44" />

            <header className="space-y-3">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-4 w-64 max-w-full" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </header>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
            </section>

            <section className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <TableRowSkeleton rows={6} />
            </section>
        </div>
    );
}
