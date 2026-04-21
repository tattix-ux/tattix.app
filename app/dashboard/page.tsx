import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { buildPageMetadata } from "@/lib/config/site";

export const metadata: Metadata = buildPageMetadata("/dashboard/profile", { noIndex: true });

export default function DashboardIndexPage() {
  redirect("/dashboard/profile");
}
