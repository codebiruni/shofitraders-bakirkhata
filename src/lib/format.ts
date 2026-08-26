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
