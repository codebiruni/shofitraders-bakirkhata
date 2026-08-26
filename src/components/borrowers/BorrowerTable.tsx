import Link from "next/link";
import { Phone, MapPin } from "@phosphor-icons/react/dist/ssr";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatBDT } from "@/lib/format";
import type { BorrowerWithStats } from "@/lib/types";
import { BorrowerRowActions } from "./BorrowerRowActions";

interface Props {
  borrowers: BorrowerWithStats[];
}

export function BorrowerTable({ borrowers }: Props) {
  return (
    <div className="ledger-card hidden overflow-hidden md:block">
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="border-b border-base-300 bg-base-200/40 text-xs text-ink-soft">
              <th className="font-medium">কাস্টমার</th>
              <th className="font-medium">ফোন</th>
              <th className="text-right font-medium">বাকি</th>
              <th className="text-right font-medium">জমা</th>
              <th className="text-right font-medium">পাওনা</th>
              <th className="font-medium">অবস্থা</th>
              <th className="text-right font-medium">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {borrowers.map((b) => (
              <tr
                key={b._id}
                className="border-b border-base-300 last:border-0 hover:bg-base-200/30"
              >
                <td>
                  <Link
                    href={`/borrowers/${b._id}`}
                    className="font-medium text-ink hover:text-primary"
                  >
                    {b.name}
                  </Link>
                </td>
                <td className="text-ink-soft">{b.phone || "—"}</td>
                <td className="text-right tabular-nums">
                  {formatBDT(b.totalBorrowed)}
                </td>
                <td className="text-right tabular-nums text-success">
                  {formatBDT(b.totalPaid)}
                </td>
                <td
                  className={`text-right tabular-nums ${b.outstanding > 0 ? "text-warning" : "text-ink-soft"
                    }`}
                >
                  {formatBDT(b.outstanding)}
                </td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
                <td>
                  <BorrowerRowActions
                    borrowerId={b._id}
                    borrowerName={b.name}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BorrowerCardList({ borrowers }: Props) {
  return (
    <ul className="space-y-3 md:hidden">
      {borrowers.map((b) => (
        <li key={b._id} className="ledger-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/borrowers/${b._id}`}
                className="block truncate text-sm font-semibold text-ink"
              >
                {b.name}
              </Link>
              {b.phone && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
                  <Phone size={12} weight="regular" />
                  {b.phone}
                </p>
              )}
              {b.address && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
                  <MapPin size={12} weight="regular" />
                  <span className="truncate">{b.address}</span>
                </p>
              )}
            </div>
            <StatusBadge status={b.status} />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="text-ink-soft">বাকি</p>
              <p className="font-medium text-ink tabular-nums">
                {formatBDT(b.totalBorrowed)}
              </p>
            </div>
            <div>
              <p className="text-ink-soft">জমা</p>
              <p className="font-medium text-success tabular-nums">
                {formatBDT(b.totalPaid)}
              </p>
            </div>
            <div>
              <p className="text-ink-soft">পাওনা</p>
              <p
                className={`font-medium tabular-nums ${b.outstanding > 0 ? "text-warning" : "text-ink-soft"
                  }`}
              >
                {formatBDT(b.outstanding)}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-1 border-t border-base-300 pt-3">
            <BorrowerRowActions borrowerId={b._id} borrowerName={b.name} />
          </div>
        </li>
      ))}
    </ul>
  );
}
