import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";

interface Props {
    currentPage: number;
    totalPages: number;
    pathname: string;
    searchParams?: Record<string, string | undefined>;
}

export function Pagination({
    currentPage,
    totalPages,
    pathname,
    searchParams = {},
}: Props) {
    if (totalPages <= 1) return null;

    const hrefForPage = (page: number) => {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(searchParams)) {
            if (value && key !== "page") params.set(key, value);
        }
        params.set("page", String(page));
        return `${pathname}?${params.toString()}`;
    };

    return (
        <nav className="flex items-center justify-center gap-3 print:hidden" aria-label="পৃষ্ঠা পরিবর্তন">
            {currentPage > 1 ? (
                <Link
                    href={hrefForPage(currentPage - 1)}
                    className="btn btn-ghost btn-sm rounded-md text-ink-soft"
                    aria-label="আগের পৃষ্ঠা"
                >
                    <CaretLeft size={16} weight="bold" />
                    আগের
                </Link>
            ) : (
                <span className="btn btn-ghost btn-sm rounded-md text-ink-soft/40" aria-hidden="true">
                    <CaretLeft size={16} weight="bold" />
                    আগের
                </span>
            )}
            <span className="text-sm text-ink-soft">
                {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages ? (
                <Link
                    href={hrefForPage(currentPage + 1)}
                    className="btn btn-ghost btn-sm rounded-md text-ink-soft"
                    aria-label="পরের পৃষ্ঠা"
                >
                    পরের
                    <CaretRight size={16} weight="bold" />
                </Link>
            ) : (
                <span className="btn btn-ghost btn-sm rounded-md text-ink-soft/40" aria-hidden="true">
                    পরের
                    <CaretRight size={16} weight="bold" />
                </span>
            )}
        </nav>
    );
}