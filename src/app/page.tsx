import Link from "next/link";
import { ArrowRight, Users } from "@phosphor-icons/react/dist/ssr";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ensureIndexes } from "@/lib/queries";
import { getDb } from "@/lib/mongodb";
import { summarizeTransactions } from "@/lib/calculations";
import { formatBDT } from "@/lib/format";
import type { Borrower, BorrowerWithStats } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadDashboardData() {
  try {
    await ensureIndexes();
    const db = await getDb();
    const [borrowers, allTxs] = await Promise.all([
      db.collection<Borrower>("borrowers").find({}).toArray(),
      db
        .collection<{ type: "borrowed" | "payment"; amount: number; borrowerId: string; date: Date }>(
          "transactions"
        )
        .find({})
        .toArray(),
    ]);

    const totalBorrowedAll = allTxs
      .filter((t) => t.type === "borrowed")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalCollectedAll = allTxs
      .filter((t) => t.type === "payment")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalOutstanding = Math.max(0, totalBorrowedAll - totalCollectedAll);

    // Per-borrower summaries for the recent list
    const summaries: BorrowerWithStats[] = borrowers.map((b) => {
      const txs = allTxs.filter((t) => t.borrowerId === b._id);
      const s = summarizeTransactions(txs);
      return {
        ...b,
        totalBorrowed: s.totalBorrowed,
        totalPaid: s.totalPaid,
        outstanding: s.outstanding,
        status: s.status,
        lastActivity: s.lastActivity,
      };
    });

    summaries.sort((a, b) => {
      const ad = a.lastActivity?.getTime() ?? 0;
      const bd = b.lastActivity?.getTime() ?? 0;
      if (bd !== ad) return bd - ad;
      return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
    });

    return {
      borrowerCount: borrowers.length,
      totalBorrowed: totalBorrowedAll,
      totalCollected: totalCollectedAll,
      totalOutstanding,
      recent: summaries.slice(0, 6),
    };
  } catch (err) {
    console.error("[dashboard] load failed", err);
    return {
      borrowerCount: 0,
      totalBorrowed: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      recent: [] as BorrowerWithStats[],
      error: true as const,
    };
  }
}

export default async function DashboardPage() {
  const data = await loadDashboardData();

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-ink md:text-3xl">
          ড্যাশবোর্ড
        </h1>
        <p className="text-sm text-ink-soft">
          আপনার কাস্টমার ও বাকির হিসাব সহজেই রাখুন।
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="মোট কাস্টমার" value={data.borrowerCount} asCurrency={false} />
        <StatCard label="মোট বাকি" value={data.totalBorrowed} />
        <StatCard label="মোট জমা" value={data.totalCollected} />
        <div className="sm:col-span-2 lg:col-span-3">
          <StatCard
            label="মোট পাওনা"
            value={data.totalOutstanding}
            prominent
            hint={
              data.totalOutstanding > 0
                ? "সব কাস্টমারের কাছে মোট পাওনা।"
                : "সব কাস্টমারের হিসাব মিটে গেছে।"
            }
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">
            সাম্প্রতিক কাস্টমার
          </h2>
          <Link
            href="/borrowers"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            সব কাস্টমার দেখুন
            <ArrowRight size={14} weight="regular" />
          </Link>
        </div>

        {data.recent.length === 0 ? (
          <EmptyState
            icon={<Users size={24} weight="regular" />}
            title="এখনো কোনো কাস্টমার নেই"
            description="Shofi Traders বাকির খাতা শুরু করতে আপনার প্রথম কাস্টমার যোগ করুন।"
            actionLabel="কাস্টমার যোগ করুন"
            actionHref="/borrowers"
          />
        ) : (
          <div className="ledger-card divide-y divide-base-300 overflow-hidden">
            {data.recent.map((b) => (
              <Link
                key={b._id}
                href={`/borrowers/${b._id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-base-200/50 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {b.name}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {b.phone || "—"}
                  </p>
                </div>
                <div className="hidden text-right text-xs sm:block">
                  <p className="text-ink-soft">বাকি</p>
                  <p className="font-medium text-ink">
                    {formatBDT(b.totalBorrowed)}
                  </p>
                </div>
                <div className="hidden text-right text-xs sm:block">
                  <p className="text-ink-soft">জমা</p>
                  <p className="font-medium text-success">
                    {formatBDT(b.totalPaid)}
                  </p>
                </div>
                <div className="hidden text-right text-xs sm:block">
                  <p className="text-ink-soft">পাওনা</p>
                  <p
                    className={
                      b.outstanding > 0
                        ? "font-medium text-warning"
                        : "font-medium text-ink-soft"
                    }
                  >
                    {formatBDT(b.outstanding)}
                  </p>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={b.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
