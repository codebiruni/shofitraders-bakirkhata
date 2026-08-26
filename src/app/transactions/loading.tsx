import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="space-y-6" aria-busy="true" aria-live="polite">
            <header className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72 max-w-full" />
            </header>

            <section className="space-y-3">
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-7 w-16 rounded-full" />
                    <Skeleton className="h-7 w-16 rounded-full" />
                    <Skeleton className="h-7 w-16 rounded-full" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </section>

            <TableRowSkeleton rows={8} />
        </div>
    );
}
