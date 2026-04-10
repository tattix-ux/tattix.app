export type AppLocale = "tr" | "en";

export const APP_LOCALE_STORAGE_KEY = "tattix:locale";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === "tr" || value === "en";
}

export function readStoredAppLocale(): AppLocale | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY);
  return isAppLocale(value) ? value : null;
}

export function persistAppLocale(locale: AppLocale) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
}
