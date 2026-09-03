import dayjs from "dayjs";
import type { Transaction } from "./types";

export interface BorrowerSummary {
  totalBorrowed: number;
  totalPaid: number;
  outstanding: number;
  lastActivity: Date | null;
  status: "paid" | "due";
}

/**
 * Compute totals from a list of transactions.
 * Totals are NEVER stored in the database — always derived here.
 */
export function summarizeTransactions(
  transactions: Pick<Transaction, "type" | "amount" | "date">[]
): BorrowerSummary {
  let totalBorrowed = 0;
  let totalPaid = 0;
  let lastActivity: Date | null = null;

  for (const tx of transactions) {
    const amount = Number(tx.amount) || 0;
    if (tx.type === "borrowed") totalBorrowed += amount;
    else if (tx.type === "payment") totalPaid += amount;

    if (tx.date) {
      const d = tx.date instanceof Date ? tx.date : new Date(tx.date);
      if (!lastActivity || d.getTime() > lastActivity.getTime()) {
        lastActivity = d;
      }
    }
  }

  const outstanding = Math.max(0, totalBorrowed - totalPaid);
  const status: "paid" | "due" = outstanding > 0 ? "due" : "paid";

  return { totalBorrowed, totalPaid, outstanding, lastActivity, status };
}

/**
 * Format a date like "25 Aug 2026".
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = dayjs(date);
  if (!d.isValid()) return "—";
  return d.format("DD MMM YYYY");
}

/**
 * Format a date with time like "25 Aug 2026, 3:45 PM".
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = dayjs(date);
  if (!d.isValid()) return "—";
  return d.format("DD MMM YYYY, h:mm A");
}

/**
 * Format a date for input[type=date] (YYYY-MM-DD).
 */
export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = dayjs(date);
  if (!d.isValid()) return "";
  return d.format("YYYY-MM-DD");
}
