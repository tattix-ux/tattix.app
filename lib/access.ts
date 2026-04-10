import type { ArtistProfile } from "@/lib/types";

export function hasProAccess(profile: Pick<ArtistProfile, "planType" | "accessStatus">) {
  return profile.planType === "pro" && profile.accessStatus === "active";
}

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const configured = process.env.TATBOT_ADMIN_EMAILS
    ?.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (!configured?.length) {
    return false;
  }

  return configured.includes(email.trim().toLowerCase());
}
