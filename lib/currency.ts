const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrencyINR(amount: number): string {
  return INR_FORMATTER.format(Number.isFinite(amount) ? amount : 0);
}
