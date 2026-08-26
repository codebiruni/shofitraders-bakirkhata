import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
    return (
        <div className="space-y-6" aria-busy="true" aria-live="polite">
            <header className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-36" />
            </header>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Skeleton className="h-10 w-full sm:max-w-sm" />
                <Skeleton className="h-9 w-36" />
            </div>

            <TableRowSkeleton rows={8} />
        </div>
    );
}
