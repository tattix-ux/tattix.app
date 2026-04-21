import type { Metadata } from "next";

import { LandingPageContent } from "@/components/landing/landing-page-content";
import { buildPageMetadata } from "@/lib/config/site";

export const metadata: Metadata = buildPageMetadata("/");

export default function Home() {
  return <LandingPageContent />;
}
