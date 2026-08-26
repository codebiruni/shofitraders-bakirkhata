"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash } from "@phosphor-icons/react/dist/ssr";
import { Receipt, ArrowDown } from "@phosphor-icons/react/dist/ssr";
import toast from "react-hot-toast";
import { deleteTransaction } from "@/app/actions/transactions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatDate } from "@/lib/calculations";
import { formatBDT } from "@/lib/format";
import type { Transaction } from "@/lib/types";

interface Props {
  borrowerId: string;
  transactions: Transaction[];
}

export function TransactionHistory({ borrowerId, transactions }: Props) {
  return (
    <div className="ledger-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-base-300 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-ink">হিসাবের ইতিহাস</h2>
        <p className="text-xs text-ink-soft">
          {transactions.length}টি এন্ট্রি
        </p>
      </div>
      <div className="hidden md:block">
        <DesktopTable borrowerId={borrowerId} transactions={transactions} />
      </div>
      <div className="md:hidden">
        <MobileList borrowerId={borrowerId} transactions={transactions} />
      </div>
    </div>
  );
}

function DesktopTable({ borrowerId, transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-sm font-medium text-ink">এখনো কোনো হিসাব নেই</p>
        <p className="mt-1 text-xs text-ink-soft">
          হিসাবের ইতিহাস শুরু করতে বাকি যোগ করুন বা টাকা জমা দিন।
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr className="border-b border-base-300 bg-base-200/40 text-xs text-ink-soft">
            <th className="font-medium">তারিখ</th>
            <th className="font-medium">হিসাবের ধরন</th>
            <th className="text-right font-medium">টাকা</th>
            <th className="font-medium">মাধ্যম</th>
            <th className="font-medium">নোট</th>
            <th className="text-right font-medium">অ্যাকশন</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <TransactionRow
              key={tx._id}
              borrowerId={borrowerId}
              tx={tx}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MobileList({ borrowerId, transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="px-6 py-10 text-center">
        <p className="text-sm font-medium text-ink">এখনো কোনো হিসাব নেই</p>
        <p className="mt-1 text-xs text-ink-soft">
          হিসাবের ইতিহাস শুরু করতে বাকি যোগ করুন বা টাকা জমা দিন।
        </p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-base-300">
      {transactions.map((tx) => (
        <MobileRow key={tx._id} borrowerId={borrowerId} tx={tx} />
      ))}
    </ul>
  );
}

function TransactionRow({ tx }: { borrowerId: string; tx: Transaction }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isBorrowed = tx.type === "borrowed";
  return (
    <tr
      className={`border-b border-base-300 last:border-0 ${isBorrowed ? "bg-primary/5" : "bg-success/5"
        }`}
    >
      <td className="whitespace-nowrap text-sm text-ink">
        {formatDate(tx.date)}
      </td>
      <td>
        <TypeBadge type={tx.type} />
      </td>
      <td
        className={`text-right text-sm font-medium tabular-nums ${isBorrowed ? "text-primary" : "text-success"
          }`}
      >
        {isBorrowed ? "+" : "−"}
        {formatBDT(tx.amount)}
      </td>
      <td className="text-sm text-ink-soft">
        {tx.paymentMethod
          ? paymentMethodLabel(tx.paymentMethod)
          : "—"}
      </td>
      <td className="max-w-[14rem] truncate text-sm text-ink-soft">
        {tx.note || "—"}
      </td>
      <td className="text-right">
        <button
          type="button"
          aria-label="হিসাব মুছুন"
          onClick={() => setConfirmOpen(true)}
          className="btn btn-ghost btn-xs rounded-md text-error hover:bg-error/10"
        >
          <Trash size={14} weight="regular" />
        </button>
      </td>
      <DeleteTxDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        txId={tx._id}
        amount={tx.amount}
        type={tx.type}
      />
    </tr>
  );
}

function MobileRow({ tx }: { borrowerId: string; tx: Transaction }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const isBorrowed = tx.type === "borrowed";
  return (
    <li
      className={`px-4 py-3 ${isBorrowed ? "bg-primary/5" : "bg-success/5"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TypeBadge type={tx.type} />
            <span
              className={`text-sm font-semibold tabular-nums ${isBorrowed ? "text-primary" : "text-success"
                }`}
            >
              {isBorrowed ? "+" : "−"}
              {formatBDT(tx.amount)}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            {formatDate(tx.date)}
            {tx.paymentMethod
              ? ` · ${paymentMethodLabel(tx.paymentMethod)}`
              : ""}
          </p>
          {tx.note && (
            <p className="mt-1 truncate text-xs text-ink-soft">{tx.note}</p>
          )}
        </div>
        <button
          type="button"
          aria-label="হিসাব মুছুন"
          onClick={() => setConfirmOpen(true)}
          className="btn btn-ghost btn-xs rounded-md text-error hover:bg-error/10"
        >
          <Trash size={14} weight="regular" />
        </button>
      </div>
      <DeleteTxDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        txId={tx._id}
        amount={tx.amount}
        type={tx.type}
      />
    </li>
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
      {isBorrowed ? <ArrowDown size={11} weight="bold" /> : <Receipt size={11} weight="bold" />}
      {isBorrowed ? "বাকি নিয়েছে" : "টাকা জমা"}
    </span>
  );
}

function paymentMethodLabel(method: "cash" | "bank" | "other") {
  if (method === "cash") return "নগদ";
  if (method === "bank") return "ব্যাংক";
  return "অন্যান্য";
}

function DeleteTxDialog({
  open,
  onClose,
  txId,
  amount,
  type,
}: {
  open: boolean;
  onClose: () => void;
  txId: string;
  amount: number;
  type: "borrowed" | "payment";
}) {
  const router = useRouter();
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="হিসাব মুছবেন?"
      description={
        <>
          {type === "borrowed" ? "বাকির হিসাব " : "জমার হিসাব "}
          <strong>{formatBDT(amount)}</strong> স্থায়ীভাবে মুছে যাবে।
          এই কাজ আর ফেরানো যাবে না।
        </>
      }
      confirmLabel="মুছুন"
      onConfirm={async () => {
        const res = await deleteTransaction(txId);
        if (res.ok) {
          toast.success("হিসাব সফলভাবে মুছে ফেলা হয়েছে।");
          onClose();
          router.refresh();
          return { ok: true };
        }
        return { ok: false, error: res.error };
      }}
    />
  );
}
