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
export type PaymentMethod = "cash" | "bkash" | "nagad" | "bank" | "other";

export interface Transaction {
  _id: string;
  borrowerId: string;
  type: TransactionType;
  amount: number;
  date: Date;
  paymentMethod?: PaymentMethod | null;
  note?: string;
  receiptNo?: string;
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
  outstanding?: number;
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type PricingType = "weight" | "pcs";

export interface InvoiceItem {
  sr: number;
  name: string;
  bundle?: number;
  pcs?: number;
  weight?: number;
  pricingType: PricingType;
  rate?: number;
  discount?: number;
  amount?: number;
}

export interface Invoice {
  _id: string;
  invoiceNo: string;
  date: Date;
  /** Time of the invoice/delivery in 24h "HH:mm" format. */
  time?: string;
  customerName: string;
  customerPhone?: string;
  billToAddress?: string;
  deliverySiteContact?: string;
  deliveryAddress?: string;
  deliveryFrom?: string;
  items: InvoiceItem[];
  subTotal?: number;
  previousDue?: number;
  currentPayment?: number;
  remainingTotal?: number;
  quantityInWords?: string;
  deliveryNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Shape of an invoice as returned by the JSON API (dates serialized to ISO
 * strings). Used on the client to pre-fill the form when editing an invoice.
 */
export type EditableInvoice = Omit<
  Invoice,
  "date" | "createdAt" | "updatedAt"
> & {
  date: string;
  createdAt?: string;
  updatedAt?: string;
};
