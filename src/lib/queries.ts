import { getDb } from "./mongodb";
import type { Borrower, Transaction } from "./types";

const BORROWERS = "borrowers";
const TRANSACTIONS = "transactions";
const INVOICES = "invoices";

/**
 * Ensure required indexes exist. Idempotent — safe to call on every request,
 * but in practice called once at app startup.
 */
export async function ensureIndexes(): Promise<void> {
  const db = await getDb();
  await db.collection(BORROWERS).createIndex({ name: 1 });
  await db.collection(BORROWERS).createIndex({ phone: 1 });
  await db.collection(TRANSACTIONS).createIndex({ borrowerId: 1 });
  await db.collection(TRANSACTIONS).createIndex({ date: -1 });
  await db.collection(INVOICES).createIndex({ invoiceNo: 1 });
  await db.collection(INVOICES).createIndex({ date: -1 });
  await db.collection(INVOICES).createIndex({ customerName: 1 });
}

// Borrower helpers
export async function findBorrowerById(id: string): Promise<Borrower | null> {
  const db = await getDb();
  const doc = await db.collection<Borrower>(BORROWERS).findOne({ _id: id as never });
  return doc ?? null;
}

/**
 * Every customer in the ledger, sorted by name for stable display.
 */
export async function findAllBorrowers(): Promise<Borrower[]> {
  const db = await getDb();
  return db.collection<Borrower>(BORROWERS).find({}).sort({ name: 1 }).toArray();
}

/**
 * All customers that can receive an SMS, i.e. every borrower whose phone
 * number is a real value (not missing, not blank). Sorted by name.
 */
export async function findBorrowersWithPhone(): Promise<Borrower[]> {
  const db = await getDb();
  return db
    .collection<Borrower>(BORROWERS)
    .find({ phone: { $type: "string", $regex: /\S/ } })
    .sort({ name: 1 })
    .toArray();
}

export async function findTransactionsByBorrower(
  borrowerId: string
): Promise<Transaction[]> {
  const db = await getDb();
  return db
    .collection<Transaction>(TRANSACTIONS)
    .find({ borrowerId })
    .sort({ date: -1, createdAt: -1 })
    .toArray();
}
