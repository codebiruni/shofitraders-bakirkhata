"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/mongodb";
import {
  borrowingInputSchema,
  objectIdSchema,
  paymentInputSchema,
} from "@/lib/validators";
import { summarizeTransactions } from "@/lib/calculations";
import { formatBDT } from "@/lib/format";
import { findBorrowerById } from "@/lib/queries";
import { sendSms } from "@/lib/sms";
import type { ActionResult, Transaction } from "@/lib/types";

const TRANSACTIONS = "transactions";

function bad(message: string): ActionResult<never> {
  return { ok: false, error: message };
}
function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

function toTxId(): string {
  return new ObjectId().toHexString();
}

function parseAmount(raw: FormDataEntryValue | null): number {
  if (raw === null) return NaN;
  const s = raw.toString().replace(/[,\s৳]/g, "");
  if (!s) return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function parseDate(raw: FormDataEntryValue | null): Date | null {
  if (raw === null) return null;
  const s = raw.toString().trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function normalizeOptional(raw: FormDataEntryValue | null): string | undefined {
  if (!raw) return undefined;
  const v = raw.toString().trim();
  return v.length === 0 ? undefined : v;
}

async function generateReceiptNo(db: Awaited<ReturnType<typeof getDb>>): Promise<string> {
  const last = await db
    .collection<Transaction>(TRANSACTIONS)
    .find({ receiptNo: { $exists: true } })
    .sort({ receiptNo: -1 })
    .limit(1)
    .toArray();
  const lastNo = last.length > 0 ? parseInt(last[0].receiptNo!.replace(/\D/g, ""), 10) || 0 : 0;
  const next = lastNo + 1;
  return `RCP-${String(next).padStart(4, "0")}`;
}

/**
 * Fire-and-forget SMS notification. Never blocks or fails the transaction if
 * the borrower has no phone or the SMS provider errors, but every outcome is
 * logged so a missing message can actually be diagnosed.
 */
async function notifyTransactionBySms(
  borrowerId: string,
  type: "borrowed" | "payment",
  amount: number
): Promise<void> {
  try {
    const borrower = await findBorrowerById(borrowerId);
    if (!borrower) {
      console.warn(`[sms] borrower ${borrowerId} not found — notification skipped`);
      return;
    }
    if (!borrower.phone?.trim()) {
      console.warn(
        `[sms] borrower ${borrower.name} has no phone number — notification skipped`
      );
      return;
    }
    const label = type === "borrowed" ? "নতুন ঋণ" : "পেমেন্ট";
    const message = `SHOFI TRADERS: টেস্ট মেসেজ — ${borrower.name} এর ${label} ${formatBDT(amount)} রেকর্ড হয়েছে।`;
    const result = await sendSms(borrower.phone, message);
    if (!result.ok) {
      console.error(
        `[sms] notification for ${borrower.name} (${borrower.phone}) not delivered: ${result.error ?? "unknown error"}`
      );
    }
  } catch (err) {
    console.error("[sms] notify failed", err);
  }
}

export async function addBorrowing(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const raw = {
    borrowerId: formData.get("borrowerId")?.toString() ?? "",
    amount: parseAmount(formData.get("amount")),
    date: parseDate(formData.get("date")) ?? new Date(),
    note: normalizeOptional(formData.get("note")),
  };
  const parsed = borrowingInputSchema.safeParse(raw);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input");

  const id = toTxId();
  const db = await getDb();
  const receiptNo = await generateReceiptNo(db);
  const doc: Transaction = {
    _id: id,
    borrowerId: parsed.data.borrowerId,
    type: "borrowed",
    amount: parsed.data.amount,
    date: parsed.data.date,
    paymentMethod: null,
    note: parsed.data.note,
    receiptNo,
    createdAt: new Date(),
  };

  try {
    await db.collection<Transaction>(TRANSACTIONS).insertOne(doc);
  } catch (err) {
    console.error("[addBorrowing] failed", err);
    return bad("Something went wrong. Please try again.");
  }

  void notifyTransactionBySms(parsed.data.borrowerId, "borrowed", parsed.data.amount);

  revalidatePath("/");
  revalidatePath("/borrowers");
  revalidatePath(`/borrowers/${parsed.data.borrowerId}`);
  revalidatePath("/transactions");
  return ok({ id });
}

export async function recordPayment(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const borrowerId = formData.get("borrowerId")?.toString() ?? "";
  const idCheck = objectIdSchema.safeParse(borrowerId);
  if (!idCheck.success) return bad("Invalid borrower");

  const raw = {
    borrowerId,
    amount: parseAmount(formData.get("amount")),
    date: parseDate(formData.get("date")) ?? new Date(),
    paymentMethod: formData.get("paymentMethod")?.toString() ?? "",
    note: normalizeOptional(formData.get("note")),
  };
  const parsed = paymentInputSchema.safeParse(raw);
  if (!parsed.success) return bad(parsed.error.issues[0]?.message ?? "Invalid input");

  const db = await getDb();

  // Validate against current outstanding (computed, never stored)
  try {
    const txs = await db
      .collection<Transaction>(TRANSACTIONS)
      .find({ borrowerId: idCheck.data })
      .toArray();
    const { outstanding } = summarizeTransactions(txs);
    if (parsed.data.amount - outstanding > 0.0001) {
      return bad("Payment exceeds the current outstanding balance.");
    }
  } catch (err) {
    console.error("[recordPayment] outstanding check failed", err);
    return bad("Something went wrong. Please try again.");
  }

  const id = toTxId();
  const receiptNo = await generateReceiptNo(db);
  const doc: Transaction = {
    _id: id,
    borrowerId: parsed.data.borrowerId,
    type: "payment",
    amount: parsed.data.amount,
    date: parsed.data.date,
    paymentMethod: parsed.data.paymentMethod,
    note: parsed.data.note,
    receiptNo,
    createdAt: new Date(),
  };

  try {
    await db.collection<Transaction>(TRANSACTIONS).insertOne(doc);
  } catch (err) {
    console.error("[recordPayment] insert failed", err);
    return bad("Something went wrong. Please try again.");
  }

  void notifyTransactionBySms(parsed.data.borrowerId, "payment", parsed.data.amount);

  revalidatePath("/");
  revalidatePath("/borrowers");
  revalidatePath(`/borrowers/${parsed.data.borrowerId}`);
  revalidatePath("/transactions");
  return ok({ id });
}

export async function deleteTransaction(id: string): Promise<ActionResult<null>> {
  const idCheck = objectIdSchema.safeParse(id);
  if (!idCheck.success) return bad("Invalid transaction id");

  let borrowerId: string | null = null;
  try {
    const db = await getDb();
    const found = await db
      .collection<Transaction>(TRANSACTIONS)
      .findOne({ _id: idCheck.data });
    if (!found) return bad("Transaction not found");
    borrowerId = found.borrowerId;
    await db.collection<Transaction>(TRANSACTIONS).deleteOne({ _id: idCheck.data });
  } catch (err) {
    console.error("[deleteTransaction] failed", err);
    return bad("Something went wrong. Please try again.");
  }

  revalidatePath("/");
  revalidatePath("/borrowers");
  if (borrowerId) revalidatePath(`/borrowers/${borrowerId}`);
  revalidatePath("/transactions");
  return ok(null);
}
