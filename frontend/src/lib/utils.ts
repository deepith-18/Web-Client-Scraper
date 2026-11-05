import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScoreTier(score: number): {
  label: string;
  badgeClass: string;
} {
  if (score >= 80) {
    return {
      label: "High Priority",
      badgeClass: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900",
    };
  } else if (score >= 60) {
    return {
      label: "Good Opportunity",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
    };
  } else if (score >= 40) {
    return {
      label: "Medium Priority",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
    };
  } else {
    return {
      label: "Low Priority",
      badgeClass: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800",
    };
  }
}

