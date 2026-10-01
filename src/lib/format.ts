// src/lib/format.ts
// Formatting utilities — safe for both server and client.

import { CURRENCY_SYMBOL } from "@/lib/constants";

/**
 * Formats a budget integer as "₹6,50,000" using Indian digit grouping.
 * Returns "—" for null/undefined.
 */
export function formatBudget(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return (
    CURRENCY_SYMBOL +
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)
  );
}

/**
 * Formats a budget in compact form: "₹6.5L", "₹1.2Cr".
 * Used on the dashboard ledger band.
 */
export function formatBudgetCompact(amount: number | null | undefined): string {
  if (amount == null) return "—";
  if (amount >= 1_00_00_000) {
    return `${CURRENCY_SYMBOL}${(amount / 1_00_00_000).toFixed(1)}Cr`;
  }
  if (amount >= 1_00_000) {
    return `${CURRENCY_SYMBOL}${(amount / 1_00_000).toFixed(1)}L`;
  }
  return (
    CURRENCY_SYMBOL +
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)
  );
}

/**
 * Formats an enquiry number as "ENQ-0042", zero-padded to 4 digits.
 */
export function formatReference(number: number): string {
  return `ENQ-${String(number).padStart(4, "0")}`;
}

/**
 * Returns initials from a full name: "Priya Raman" → "PR".
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * Extracts only digit characters from a phone string.
 * Used for the phoneDigits derived column for normalised search.
 */
export function extractDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** Alias — full Indian-style currency (₹6,50,000). Returns "—" for null. */
export const formatCurrency = formatBudget;

/** Alias — compact currency (₹6.5L / ₹1.2Cr). Returns "—" for null. */
export const formatCompactCurrency = formatBudgetCompact;
