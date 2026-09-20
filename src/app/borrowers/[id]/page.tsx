import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Note } from "@phosphor-icons/react/dist/ssr";
import { findBorrowerById, findTransactionsByBorrower } from "@/lib/queries";
import { summarizeTransactions } from "@/lib/calculations";
import { objectIdSchema } from "@/lib/validators";
import { TransactionActionButtons } from "@/components/transactions/TransactionActionButtons";
import { TransactionHistory } from "@/components/transactions/TransactionHistory";
import { formatBDT } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BorrowerProfilePage({ params }: PageProps) {
  const { id } = await params;
  const idCheck = objectIdSchema.safeParse(id);
  if (!idCheck.success) notFound();

  let borrower;
  let transactions;
  try {
    [borrower, transactions] = await Promise.all([
      findBorrowerById(idCheck.data),
      findTransactionsByBorrower(idCheck.data),
    ]);
  } catch (err) {
    console.error("[borrower profile] load failed", err);
    throw err; // surfaced to error.tsx boundary
  }
  if (!borrower) notFound();

  const summary = summarizeTransactions(transactions);

  return (
    <div className="space-y-8">
      <Link
        href="/borrowers"
        className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
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
        <TransactionActionButtons
          borrowerId={borrower._id}
          outstanding={summary.outstanding}
        />
      </header>

      <TransactionHistory
        borrowerId={borrower._id}
        borrowerName={borrower.name}
        borrowerPhone={borrower.phone}
        borrowerAddress={borrower.address}
        transactions={transactions}
      />

      <p className="text-center text-xs text-ink-soft">
        {transactions.length}টি হিসাব ·
        নিট অবস্থান: {formatBDT(summary.outstanding)}
      </p>
    </div>
  );
}
