const derivedUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

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

    if (!currentOrigin.includes("localhost") && !currentOrigin.includes("127.0.0.1")) {
      return currentOrigin;
    }
  }

  return derivedUrl;
}
