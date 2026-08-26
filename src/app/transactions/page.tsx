import Link from "next/link";
import { ArrowDown, Receipt } from "@phosphor-icons/react/dist/ssr";
import { getDb } from "@/lib/mongodb";
import { ensureIndexes } from "@/lib/queries";
import { formatDate } from "@/lib/calculations";
import { formatBDT } from "@/lib/format";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Borrower, Transaction, TransactionWithBorrower } from "@/lib/types";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ type?: string; q?: string; from?: string; to?: string }>;
}

async function loadTransactions(filters: {
  type?: string;
  q?: string;
  from?: string;
  to?: string;
}): Promise<TransactionWithBorrower[]> {
  try {
    await ensureIndexes();
    const db = await getDb();
    const query: Record<string, unknown> = {};
    if (filters.type === "borrowed" || filters.type === "payment") {
      query.type = filters.type;
    }
    if (filters.from || filters.to) {
      const date: Record<string, Date> = {};
      if (filters.from) date.$gte = new Date(`${filters.from}T00:00:00`);
      if (filters.to) date.$lte = new Date(`${filters.to}T23:59:59.999`);
      query.date = date;
    }

    // First fetch borrowers for the search filter, then their transactions
    let borrowerIds: string[] | null = null;
    if (filters.q && filters.q.trim()) {
      const re = new RegExp(escapeRegex(filters.q.trim()), "i");
      const matched = await db
        .collection<Borrower>("borrowers")
        .find({ $or: [{ name: re }, { phone: re }] })
        .project<{ _id: string }>({ _id: 1 })
        .toArray();
      borrowerIds = matched.map((b) => b._id);
      if (borrowerIds.length === 0) return [];
      query.borrowerId = { $in: borrowerIds };
    }

    const txs = await db
      .collection<Transaction>("transactions")
      .find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(500)
      .toArray();

    if (txs.length === 0) return [];
    const ids = Array.from(new Set(txs.map((t) => t.borrowerId)));
    const borrowers = await db
      .collection<Borrower>("borrowers")
      .find({ _id: { $in: ids } })
      .toArray();
    const byId = new Map(borrowers.map((b) => [b._id, b]));
    return txs.map((t) => ({
      ...t,
      borrowerName: byId.get(t.borrowerId)?.name ?? "Unknown",
    }));
  } catch (err) {
    console.error("[transactions page] load failed", err);
    return [];
  }
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function TransactionsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const txs = await loadTransactions(sp);

  const totals = txs.reduce(
    (acc, t) => {
      if (t.type === "borrowed") acc.borrowed += t.amount;
      else acc.collected += t.amount;
      return acc;
    },
    { borrowed: 0, collected: 0 }
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-medium text-ink-soft">
          হিসাব
        </p>
        <h1 className="text-2xl font-semibold text-ink md:text-3xl">
          হিসাবের তালিকা
        </h1>
        <p className="text-sm text-ink-soft">
          {txs.length}টি হিসাব ·
          {" "}
          <span className="text-primary">{formatBDT(totals.borrowed)}</span> বাকি ·{" "}
          <span className="text-success">{formatBDT(totals.collected)}</span> জমা
        </p>
      </header>

      <TransactionFilters />

      {txs.length === 0 ? (
        <EmptyState
          icon={<Receipt size={24} weight="regular" />}
          title="এখনো কোনো হিসাব নেই"
          description="এখানে এন্ট্রি দেখতে বাকি যোগ করুন অথবা টাকা জমা দিন।"
          actionLabel="কাস্টমারের তালিকায় যান"
          actionHref="/borrowers"
        />
      ) : (
        <>
          <div className="ledger-card hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr className="border-b border-base-300 bg-base-200/40 text-xs text-ink-soft">
                    <th className="font-medium">তারিখ</th>
                    <th className="font-medium">কাস্টমার</th>
                    <th className="font-medium">হিসাবের ধরন</th>
                    <th className="text-right font-medium">টাকা</th>
                    <th className="font-medium">মাধ্যম</th>
                    <th className="font-medium">নোট</th>
                  </tr>
                </thead>
                <tbody>
                  {txs.map((t) => (
                    <tr
                      key={t._id}
                      className={`border-b border-base-300 last:border-0 ${t.type === "borrowed" ? "bg-primary/5" : "bg-success/5"
                        }`}
                    >
                      <td className="whitespace-nowrap text-sm text-ink">
                        {formatDate(t.date)}
                      </td>
                      <td>
                        <Link
                          href={`/borrowers/${t.borrowerId}`}
                          className="font-medium text-ink hover:text-primary"
                        >
                          {t.borrowerName}
                        </Link>
                      </td>
                      <td>
                        <TypeBadge type={t.type} />
                      </td>
                      <td
                        className={`text-right text-sm font-medium tabular-nums ${t.type === "borrowed"
                          ? "text-primary"
                          : "text-success"
                          }`}
                      >
                        {t.type === "borrowed" ? "+" : "−"}
                        {formatBDT(t.amount)}
                      </td>
                      <td className="text-sm text-ink-soft">
                        {t.paymentMethod
                          ? paymentMethodLabel(t.paymentMethod)
                          : "—"}
                      </td>
                      <td className="max-w-[18rem] truncate text-sm text-ink-soft">
                        {t.note || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ul className="space-y-2 md:hidden">
            {txs.map((t) => {
              const isBorrowed = t.type === "borrowed";
              return (
                <li
                  key={t._id}
                  className={`ledger-card p-4 ${isBorrowed ? "bg-primary/5" : "bg-success/5"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/borrowers/${t.borrowerId}`}
                      className="text-sm font-semibold text-ink hover:text-primary"
                    >
                      {t.borrowerName}
                    </Link>
                    <TypeBadge type={t.type} />
                  </div>
                  <p
                    className={`mt-1 text-lg font-semibold tabular-nums ${isBorrowed ? "text-primary" : "text-success"
                      }`}
                  >
                    {isBorrowed ? "+" : "−"}
                    {formatBDT(t.amount)}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {formatDate(t.date)}
                    {t.paymentMethod
                      ? ` · ${paymentMethodLabel(t.paymentMethod)}`
                      : ""}
                  </p>
                  {t.note && (
                    <p className="mt-1 truncate text-xs text-ink-soft">
                      {t.note}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function TypeBadge({ type }: { type: "borrowed" | "payment" }) {
  const isBorrowed = type === "borrowed";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${isBorrowed
        ? "border-primary/30 bg-primary/10 text-primary"
        : "border-success/30 bg-success/10 text-success"
        }`}
    >
      {isBorrowed ? (
        <ArrowDown size={11} weight="bold" />
      ) : (
        <Receipt size={11} weight="bold" />
      )}
      {isBorrowed ? "বাকি নিয়েছে" : "টাকা জমা"}
    </span>
  );
}

function paymentMethodLabel(method: "cash" | "bank" | "other") {
  if (method === "cash") return "নগদ";
  if (method === "bank") return "ব্যাংক";
  return "অন্যান্য";
}
