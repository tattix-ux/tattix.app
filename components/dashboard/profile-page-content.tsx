"use client";

import { ProfileForm } from "@/components/dashboard/profile-form";
import { ProfileRequestSettings } from "@/components/dashboard/profile-request-settings";
import type { ArtistFunnelSettings, ArtistProfile, ArtistStyleOption } from "@/lib/types";
import type { PublicLocale } from "@/lib/i18n/public";

export function ProfilePageContent({
  profile,
  funnelSettings,
  styleOptions,
  demoMode,
  locale,
}: {
  profile: ArtistProfile;
  funnelSettings: ArtistFunnelSettings;
  styleOptions: ArtistStyleOption[];
  demoMode: boolean;
  locale: PublicLocale;
}) {
  return (
    <div className="min-w-0">
      <ProfileForm
        profile={profile}
        upperLabel={funnelSettings.introEyebrow}
        demoMode={demoMode}
        locale={locale}
        layout="split"
        secondaryPanel={
          <ProfileRequestSettings
            settings={funnelSettings}
            styles={styleOptions}
            demoMode={demoMode}
            locale={locale}
          />
        }
      />
    </div>
  );
}
