import { unstable_cache } from "next/cache";
import { Users } from "@phosphor-icons/react/dist/ssr";
import { getDb } from "@/lib/mongodb";
import { summarizeTransactions } from "@/lib/calculations";
import { EmptyState } from "@/components/ui/EmptyState";
import { BorrowerList } from "@/components/borrowers/BorrowerList";
import { BorrowerSearch } from "@/components/borrowers/BorrowerSearch";
import { CreateBorrowerButton } from "@/components/borrowers/CreateBorrowerButton";
import { Pagination } from "@/components/ui/Pagination";
import type { Borrower, BorrowerWithStats, Transaction } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

const PAGE_SIZE = 10;

async function loadBorrowers(q?: string) {
  try {
    const db = await getDb();
    const filter: Record<string, unknown> = {};
    if (q && q.trim()) {
      const re = new RegExp(escapeRegex(q.trim()), "i");
      filter.$or = [{ name: re }, { phone: re }];
    }
    const [borrowers, allTxs] = await Promise.all([
      db
        .collection<Borrower>("borrowers")
        .find(filter)
        .sort({ createdAt: -1 })
        .toArray(),
      db.collection<Transaction>("transactions").find({}).toArray(),
    ]);

    return borrowers.map<BorrowerWithStats>((b) => {
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
  } catch (err) {
    console.error("[borrowers page] load failed", err);
    return [] as BorrowerWithStats[];
  }
}

const cachedLoadBorrowers = unstable_cache(
  loadBorrowers,
  ["borrowers-list"],
  { tags: ["borrowers"] }
);

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function BorrowersPage({ searchParams }: PageProps) {
  const { q, page: pageParam } = await searchParams;
  const borrowers = await cachedLoadBorrowers(q);
  const requestedPage = Number.parseInt(pageParam ?? "1", 10);
  const totalPages = Math.max(1, Math.ceil(borrowers.length / PAGE_SIZE));
  const currentPage = Math.min(
    Math.max(Number.isNaN(requestedPage) ? 1 : requestedPage, 1),
    totalPages
  );
  const visibleBorrowers = borrowers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-medium text-ink-soft">
          বাকির খাতা
        </p>
        <h1 className="text-2xl font-semibold text-ink md:text-3xl">
          কাস্টমার
        </h1>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <BorrowerSearch />
        <CreateBorrowerButton />
      </div>

      {borrowers.length === 0 ? (
        q ? (
          <EmptyState
            icon={<Users size={24} weight="regular" />}
            title="কোনো কাস্টমার পাওয়া যায়নি"
            description="অন্য নাম বা ফোন নম্বর দিয়ে চেষ্টা করুন।"
          />
        ) : (
          <EmptyState
            icon={<Users size={24} weight="regular" />}
            title="এখনো কোনো কাস্টমার নেই"
            description="Shofi Traders বাকির খাতা শুরু করতে আপনার প্রথম কাস্টমার যোগ করুন।"
            action={<CreateBorrowerButton />}
          />
        )
      ) : (
        <>
          <BorrowerList initialBorrowers={visibleBorrowers} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pathname="/borrowers"
            searchParams={{ q }}
          />
        </>
      )}
    </div>
  );
}
