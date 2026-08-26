import { StatCardSkeleton, TableRowSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="space-y-8" aria-busy="true" aria-live="polite">
            <header className="space-y-2">
                <Skeleton className="h-8 w-44" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </header>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <div className="sm:col-span-2 lg:col-span-3">
                    <StatCardSkeleton />
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-36" />
                    <Skeleton className="h-4 w-28" />
                </div>
                <TableRowSkeleton rows={6} />
            </section>
        </div>
    );
}
