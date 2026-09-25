import { RiskLevel } from "@/shared/types/ml-contract";

export function formatCurrencyCrores(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0.00 Cr";
  return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;
}

export function formatPercentage(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return "0.0%";
  return `${val.toFixed(decimals)}%`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "N/A";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function getRiskLevelBadgeClass(level: RiskLevel): string {
  switch (level) {
    case "CRITICAL":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300";
    case "HIGH":
      return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300";
    case "MEDIUM":
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300";
    case "LOW":
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

export function getRiskLevelColor(level: RiskLevel): string {
  switch (level) {
    case "CRITICAL":
      return "#dc2626"; // red-600
    case "HIGH":
      return "#ea580c"; // orange-600
    case "MEDIUM":
      return "#d97706"; // amber-600
    case "LOW":
      return "#059669"; // emerald-600
    default:
      return "#6b7280";
  }
}
