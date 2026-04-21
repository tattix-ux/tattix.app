import type { Metadata } from "next";

const PRODUCTION_APP_URL = "https://tattix.io";

function normalizeConfiguredUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function normalizeCanonicalPath(path: string) {
  if (!path || path === "/") {
    return "/";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

const derivedUrl =
  normalizeConfiguredUrl(process.env.NEXT_PUBLIC_APP_URL) ??
  (process.env.NODE_ENV === "production" ? PRODUCTION_APP_URL : "http://localhost:3000");

export const siteConfig = {
  name: "Tattix",
  description:
    "A mobile-first link-in-bio funnel and tattoo price estimator for modern tattoo artists.",
  url: derivedUrl,
  demoSlug: "ink-atelier-demo",
};

export function getAppOrigin() {
  if (typeof window !== "undefined") {
    const currentOrigin = window.location.origin;

    if (currentOrigin.includes("localhost") || currentOrigin.includes("127.0.0.1")) {
      return currentOrigin;
    }
  }

  return siteConfig.url;
}

export function buildPageMetadata(
  path: string,
  options?: { noIndex?: boolean },
): Pick<Metadata, "alternates" | "robots"> {
  const metadata: Pick<Metadata, "alternates" | "robots"> = {
    alternates: {
      canonical: normalizeCanonicalPath(path),
    },
  };

  if (options?.noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  return metadata;
}
