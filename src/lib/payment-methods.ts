import type { PaymentMethod } from "./types";

/**
 * Bangla display label for a payment method.
 *
 * Single source of truth so the deposit form, transaction history, the
 * transactions list and the printed receipt always agree.
 */
export function paymentMethodLabel(method: PaymentMethod): string {
    if (method === "cash") return "ক্যাশ";
    if (method === "bkash") return "বিকাশ";
    if (method === "nagad") return "নগদ";
    if (method === "bank") return "ব্যাংক";
    return "অন্যান্য";
}

/**
 * Options for the deposit form's method select, in display order.
 */
export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
    { value: "cash", label: "ক্যাশ" },
    { value: "bkash", label: "বিকাশ" },
    { value: "nagad", label: "নগদ" },
    { value: "bank", label: "ব্যাংক" },
    { value: "other", label: "অন্যান্য" },
];
