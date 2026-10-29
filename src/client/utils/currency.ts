/**
 * Fintech Monetary Utilities
 * Represents Indian Rupee (INR) amounts using integer paise (1 Rupee = 100 paise)
 * Never uses floating-point arithmetic for monetary calculations.
 */

export function formatPaise(paise: number | bigint | undefined | null): string {
  if (paise === undefined || paise === null) return '₹0.00';
  const numericPaise = typeof paise === 'bigint' ? Number(paise) : paise;
  const rupees = numericPaise / 100;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function formatRupeesRaw(paise: number): string {
  return (paise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function rupeesToPaise(rupees: number | string): number {
  const num = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}
