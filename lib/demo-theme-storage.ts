import { pageThemeSchema } from "@/lib/forms/schemas";
import { resolveArtistTheme } from "@/lib/theme";
import type { ArtistPageTheme } from "@/lib/types";

export const DEMO_THEME_STORAGE_KEY = "tattix-demo-theme";
export const DEMO_THEME_EVENT = "tattix-demo-theme-change";

export function saveDemoTheme(theme: ArtistPageTheme) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(DEMO_THEME_STORAGE_KEY, JSON.stringify(theme));
  window.dispatchEvent(new Event(DEMO_THEME_EVENT));
}

export function loadDemoTheme() {
  const raw = loadDemoThemeSnapshot();
  return parseDemoThemeSnapshot(raw);
}

export function loadDemoThemeSnapshot() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(DEMO_THEME_STORAGE_KEY);
}

export function parseDemoThemeSnapshot(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const validated = pageThemeSchema.safeParse(parsed);

    if (!validated.success) {
      return null;
    }

    return resolveArtistTheme({
      ...validated.data,
      backgroundImageUrl: validated.data.backgroundImageUrl || null,
      customWelcomeTitle: validated.data.customWelcomeTitle || null,
      customIntroText: validated.data.customIntroText || null,
      customCtaLabel: validated.data.customCtaLabel || null,
      featuredSectionLabel1: validated.data.featuredSectionLabel1 || null,
      featuredSectionLabel2: validated.data.featuredSectionLabel2 || null,
    });
  } catch {
    return null;
  }
}

export function subscribeDemoTheme(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === DEMO_THEME_STORAGE_KEY) {
      onStoreChange();
    }
  };

  const handleCustomChange = () => {
    onStoreChange();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(DEMO_THEME_EVENT, handleCustomChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(DEMO_THEME_EVENT, handleCustomChange);
  };
}
