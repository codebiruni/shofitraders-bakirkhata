/**
 * Format a number as Bangladeshi Taka using the en-IN grouping style.
 * 125000 -> "৳1,25,000"
 * 1234567 -> "৳12,34,567"
 */
export function formatBDT(amount: number | null | undefined): string {
  const value = Number.isFinite(amount ?? NaN) ? (amount as number) : 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
  return `৳${formatted}`;
}

/**
 * Format a number with Indian grouping (without the ৳ prefix).
 */
export function formatNumber(amount: number | null | undefined): string {
  const value = Number.isFinite(amount ?? NaN) ? (amount as number) : 0;
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Format a date (Date or ISO string) with both date and time,
 * e.g. "4 Sep 2026, 3:42 PM".
 */
export function formatDateTime(
  value: Date | string | null | undefined
): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function convertHundreds(n: number): string {
  let result = "";
  if (n >= 100) {
    result += ONES[Math.floor(n / 100)] + " Hundred";
    n %= 100;
    if (n > 0) result += " ";
  }
  if (n >= 20) {
    result += TENS[Math.floor(n / 10)];
    n %= 10;
    if (n > 0) result += " " + ONES[n];
  } else if (n > 0) {
    result += ONES[n];
  }
  return result.trim();
}

/**
 * Convert a number to words using the Indian numbering system (lakhs, crores).
 * Handles up to 99,99,99,999 (≈100 crore).
 * Returns e.g. "One Lakh Twenty-Five Thousand Five Hundred Fifty Taka Only"
 */
export function numberToWords(amount: number | null | undefined): string {
  const value = Number.isFinite(amount ?? NaN) ? Math.round(amount as number) : 0;
  if (value === 0) return "Zero Taka Only";

  const abs = Math.abs(value);
  let result = "";

  const crore = Math.floor(abs / 10000000);
  const lakh = Math.floor((abs % 10000000) / 100000);
  const thousand = Math.floor((abs % 100000) / 1000);
  const hundred = abs % 1000;

  if (crore > 0) {
    result += convertHundreds(crore) + " Crore";
  }
  if (lakh > 0) {
    if (result) result += " ";
    result += convertHundreds(lakh) + " Lakh";
  }
  if (thousand > 0) {
    if (result) result += " ";
    result += convertHundreds(thousand) + " Thousand";
  }
  if (hundred > 0) {
    if (result) result += " ";
    result += convertHundreds(hundred);
  }

  return result + " Taka Only";
}
