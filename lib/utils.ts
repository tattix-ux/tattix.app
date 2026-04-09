import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrencyRange(
  minimum: number,
  maximum: number,
  currency: string,
) {
  const formatter = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  return `${formatter.format(minimum)} - ${formatter.format(maximum)}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sanitizePhoneNumber(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function toTitleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

export function roundToNearestFifty(value: number) {
  return Math.round(value / 50) * 50;
}

export function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((piece) => piece[0]?.toUpperCase() ?? "")
    .join("");
}

export function notesPreview(input: string | null | undefined, fallback = "No notes") {
  if (!input) {
    return fallback;
  }

  return input.length > 72 ? `${input.slice(0, 72)}...` : input;
}
