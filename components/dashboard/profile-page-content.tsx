"use client";

import { useEffect, useState } from "react";

import { ProfileForm, ProfilePreviewCard, type ProfilePreviewDraft } from "@/components/dashboard/profile-form";
import { ProfileRequestSettings } from "@/components/dashboard/profile-request-settings";
import type { ArtistFunnelSettings, ArtistPageTheme, ArtistProfile, ArtistStyleOption } from "@/lib/types";
import type { PublicLocale } from "@/lib/i18n/public";

export function ProfilePageContent({
  profile,
  pageTheme,
  funnelSettings,
  styleOptions,
  demoMode,
  locale,
}: {
  profile: ArtistProfile;
  pageTheme: ArtistPageTheme;
  funnelSettings: ArtistFunnelSettings;
  styleOptions: ArtistStyleOption[];
  demoMode: boolean;
  locale: PublicLocale;
}) {
  const [previewDraft, setPreviewDraft] = useState<ProfilePreviewDraft>({
    artistName: profile.artistName,
    upperLabel: funnelSettings.introEyebrow,
    profileImageUrl: profile.profileImageUrl,
    coverImageUrl: profile.coverImageUrl,
    welcomeHeadline: profile.welcomeHeadline,
    shortBio: profile.shortBio,
  });

  useEffect(() => {
    setPreviewDraft({
      artistName: profile.artistName,
      upperLabel: funnelSettings.introEyebrow,
      profileImageUrl: profile.profileImageUrl,
      coverImageUrl: profile.coverImageUrl,
      welcomeHeadline: profile.welcomeHeadline,
      shortBio: profile.shortBio,
    });
  }, [funnelSettings.introEyebrow, profile]);

  return (
    <div className="grid gap-3.5 xl:grid-cols-[minmax(0,520px)_minmax(260px,300px)] xl:items-start xl:justify-between xl:gap-4 2xl:grid-cols-[minmax(0,560px)_minmax(280px,320px)]">
      <div className="min-w-0 max-w-[580px] space-y-3.5 2xl:max-w-[620px]">
        <ProfileForm
          profile={profile}
          upperLabel={funnelSettings.introEyebrow}
          demoMode={demoMode}
          locale={locale}
          onPreviewChange={setPreviewDraft}
        />
        <ProfileRequestSettings
          settings={funnelSettings}
          styles={styleOptions}
          demoMode={demoMode}
          locale={locale}
        />
      </div>
      <ProfilePreviewCard
        profile={{
          ...profile,
          artistName: previewDraft.artistName,
          profileImageUrl: previewDraft.profileImageUrl,
          coverImageUrl: previewDraft.coverImageUrl,
          welcomeHeadline: previewDraft.welcomeHeadline,
          shortBio: previewDraft.shortBio,
        }}
        pageTheme={pageTheme}
        upperLabel={previewDraft.upperLabel}
        locale={locale}
      />
    </div>
  );
}
