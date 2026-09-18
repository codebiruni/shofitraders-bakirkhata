import Link from "next/link";
import {
  ChatTeardropText,
  Users,
  Phone,
  PhoneX,
} from "@phosphor-icons/react/dist/ssr";
import { findAllBorrowers } from "@/lib/queries";
import { isSmsConfigured } from "@/lib/sms";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageComposer } from "@/components/messages/MessageComposer";
import type { Borrower } from "@/lib/types";

export const dynamic = "force-dynamic";

async function loadCustomers(): Promise<Borrower[]> {
  try {
    return await findAllBorrowers();
  } catch (err) {
    console.error("[messages page] load failed", err);
    return [];
  }
}

function phoneOf(borrower: Borrower): string | null {
  const phone = borrower.phone?.trim();
  return phone && phone.length > 0 ? phone : null;
}

export default async function MessagesPage() {
  const customers = await loadCustomers();
  const smsConfigured = isSmsConfigured();
  const recipients = customers.filter((b) => phoneOf(b) !== null);
  const withoutPhone = customers.length - recipients.length;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-medium text-ink-soft">বাকির খাতা</p>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-ink md:text-3xl">
          <ChatTeardropText size={26} weight="regular" className="text-primary" />
          মেসেজ পাঠান
        </h1>
        <p className="text-sm text-ink-soft">
          উৎসব, অফার বা মনে করিয়ে দেওয়ার মেসেজ একবার লিখে সব কাস্টমারকে পাঠান।
        </p>
      </header>

      <MessageComposer
        recipients={recipients.map((b) => ({
          _id: b._id,
          name: b.name,
          phone: b.phone,
        }))}
        withoutPhone={withoutPhone}
        smsConfigured={smsConfigured}
      />

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">কাস্টমার তালিকা</h2>
          <p className="text-xs text-ink-soft">
            মোট {customers.length} জন
            {withoutPhone > 0 && (
              <>
                {" · "}
                <span className="text-warning">{withoutPhone} জনের ফোন নম্বর নেই</span>
              </>
            )}
          </p>
        </div>

        {customers.length === 0 ? (
          <EmptyState
            icon={<Users size={24} weight="regular" />}
            title="এখনো কোনো কাস্টমার নেই"
            description="মেসেজ পাঠাতে হলে আগে কাস্টমার যোগ করতে হবে।"
            actionLabel="কাস্টমার যোগ করুন"
            actionHref="/borrowers"
          />
        ) : (
          <>
            <div className="ledger-card hidden overflow-hidden md:block">
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-b border-base-300 bg-base-200/40 text-xs text-ink-soft">
                      <th className="w-12 font-medium">#</th>
                      <th className="font-medium">কাস্টমার</th>
                      <th className="font-medium">ফোন নম্বর</th>
                      <th className="w-28 font-medium">মেসেজ যাবে</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((b, index) => {
                      const phone = phoneOf(b);
                      return (
                        <tr
                          key={b._id}
                          className="border-b border-base-300 last:border-0 hover:bg-base-200/30"
                        >
                          <td className="text-xs text-ink-soft tabular-nums">
                            {index + 1}
                          </td>
                          <td>
                            <Link
                              href={`/borrowers/${b._id}`}
                              className="font-medium text-ink hover:text-primary"
                            >
                              {b.name}
                            </Link>
                          </td>
                          <td className="text-ink-soft tabular-nums">
                            {phone ?? <span className="text-warning">—</span>}
                          </td>
                          <td>
                            {phone ? (
                              <span className="text-xs text-success">হ্যাঁ</span>
                            ) : (
                              <span className="text-xs text-ink-soft">ফোন নেই</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <ul className="space-y-2 md:hidden">
              {customers.map((b, index) => {
                const phone = phoneOf(b);
                return (
                  <li key={b._id} className="ledger-card flex items-center gap-3 p-3.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary tabular-nums">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/borrowers/${b._id}`}
                        className="block truncate text-sm font-semibold text-ink"
                      >
                        {b.name}
                      </Link>
                      {phone ? (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft tabular-nums">
                          <Phone size={12} weight="regular" />
                          {phone}
                        </p>
                      ) : (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-warning">
                          <PhoneX size={12} weight="regular" />
                          ফোন নম্বর নেই — মেসেজ যাবে না
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
