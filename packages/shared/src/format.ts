/** Number / currency formatting helpers shared by API reports and the web UI. */

/** Indian digit grouping (lakh/crore) for large INR figures. */
export function formatIndian(number: number, maxFractionDigits = 0): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: maxFractionDigits,
  }).format(number);
}

/** Compact INR string, e.g. ₹1.2 Cr, ₹8 L. */
export function formatInrCompact(amountInr: number): string {
  const abs = Math.abs(amountInr);
  if (abs >= 100_000_000) return `₹${(amountInr / 100_000_000).toFixed(1)} Cr`;
  if (abs >= 100_000) return `₹${(amountInr / 100_000).toFixed(1)} L`;
  if (abs >= 1_000) return `₹${(amountInr / 1_000).toFixed(1)} K`;
  return `₹${amountInr.toFixed(0)}`;
}

export function formatInr(amountInr: number): string {
  return `₹${formatIndian(amountInr)}`;
}

export function formatNumber(value: number, maxFractionDigits = 1): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

export function formatTons(value: number): string {
  return `${formatNumber(value, 1)} t`;
}

export function formatPercent(ratio: number, maxFractionDigits = 1): string {
  return `${(ratio * 100).toFixed(maxFractionDigits)}%`;
}

export function formatTonnesCo2(value: number): string {
  return `${formatNumber(value, 1)} tCO₂e`;
}

export type UnitFormat = Record<string, (v: number) => string>;

export const unitFormatters: UnitFormat = {
  kwh: (v) => `${formatNumber(v)} kWh/yr`,
  kl: (v) => `${formatNumber(v)} kL/yr`,
  kg: (v) => `${formatNumber(v)} kg/yr`,
  t: (v) => `${formatNumber(v, 1)} t/yr`,
  tco2e: (v) => formatTonnesCo2(v),
  inr: (v) => formatInr(v),
  percent: (v) => `${v.toFixed(0)}%`,
  years: (v) => `${v.toFixed(1)} yr`,
};