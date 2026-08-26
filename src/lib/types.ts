export type BorrowerId = string; // Mongo ObjectId hex

export interface Borrower {
  _id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType = "borrowed" | "payment";
export type PaymentMethod = "cash" | "bank" | "other";

export interface Transaction {
  _id: string;
  borrowerId: string;
  type: TransactionType;
  amount: number;
  date: Date;
  paymentMethod?: PaymentMethod | null;
  note?: string;
  createdAt: Date;
}

export interface BorrowerWithStats extends Borrower {
  totalBorrowed: number;
  totalPaid: number;
  outstanding: number;
  status: "paid" | "due";
  lastActivity: Date | null;
}

export interface TransactionWithBorrower extends Transaction {
  borrowerName: string;
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
