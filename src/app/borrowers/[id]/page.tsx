import Link from "next/link";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Note } from "@phosphor-icons/react/dist/ssr";
import { findBorrowerById, findTransactionsByBorrower } from "@/lib/queries";
import { summarizeTransactions } from "@/lib/calculations";
import { objectIdSchema } from "@/lib/validators";
import { TransactionActionButtons } from "@/components/transactions/TransactionActionButtons";
import { TransactionHistory } from "@/components/transactions/TransactionHistory";
import { StatCard } from "@/components/ui/StatCard";
import { formatBDT } from "@/lib/format";
import { Pagination } from "@/components/ui/Pagination";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

const PAGE_SIZE = 10;

const cachedLoadBorrowerProfile = unstable_cache(
  async (borrowerId: string) =>
    Promise.all([
      findBorrowerById(borrowerId),
      findTransactionsByBorrower(borrowerId),
    ]),
  ["borrower-profile"],
  { tags: ["borrowers", "transactions"] }
);

export default async function BorrowerProfilePage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const idCheck = objectIdSchema.safeParse(id);
  if (!idCheck.success) notFound();

  let borrower;
  let transactions;
  try {
    [borrower, transactions] = await cachedLoadBorrowerProfile(idCheck.data);
  } catch (err) {
    console.error("[borrower profile] load failed", err);
    throw err; // surfaced to error.tsx boundary
  }
  if (!borrower) notFound();

  const summary = summarizeTransactions(transactions);
  const requestedPage = Number.parseInt(pageParam ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const currentPage = Math.min(
    Math.max(Number.isNaN(requestedPage) ? 1 : requestedPage, 1),
    totalPages
  );

  return (
    <div className="space-y-8">
      <Link
        href="/borrowers"
        className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink print:hidden"
      >
        <ArrowLeft size={14} weight="regular" />
        কাস্টমারের তালিকায় ফিরুন
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold text-ink md:text-3xl">
            {borrower.name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
            {borrower.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone size={14} weight="regular" />
                {borrower.phone}
              </span>
            )}
            {borrower.address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={14} weight="regular" />
                {borrower.address}
              </span>
            )}
          </div>
          {borrower.notes && (
            <p className="mt-2 inline-flex items-start gap-1.5 text-sm text-ink-soft">
              <Note size={14} weight="regular" className="mt-0.5 shrink-0" />
              <span>{borrower.notes}</span>
            </p>
          )}
        </div>
        <div className="print:hidden">
          <TransactionActionButtons
            borrowerId={borrower._id}
            outstanding={summary.outstanding}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="মোট ঋণ" value={summary.totalBorrowed} />
        <StatCard label="মোট পরিশোধ" value={summary.totalPaid} />
        <StatCard
          label="বকেয়া"
          value={summary.outstanding}
          prominent
        />
        {summary.deposit > 0 && (
          <StatCard label="ডিপোজিট" value={summary.deposit} />
        )}
      </div>

      <TransactionHistory
        borrowerName={borrower.name}
        borrowerPhone={borrower.phone}
        borrowerAddress={borrower.address}
        transactions={transactions}
        page={currentPage}
        summary={summary}
      />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pathname={`/borrowers/${borrower._id}`}
      />

      <p className="text-center text-xs text-ink-soft">
        {transactions.length}টি হিসাব ·
        নিট অবস্থান: {formatBDT(summary.outstanding)}
      </p>
    </div>
  );
}
