"use client";

import { ArtistPageShell } from "@/components/artist-page/artist-page-shell";
import { AvatarTile } from "@/components/shared/avatar-tile";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { intentOptions } from "@/lib/constants/options";
import type { ArtistPageData, ArtistPageTheme } from "@/lib/types";

export function ArtistPagePreview({
  artist,
  theme,
  device = "mobile",
}: {
  artist: ArtistPageData;
  theme: ArtistPageTheme;
  device?: "mobile" | "desktop";
}) {
  const previewWidth = device === "mobile" ? "max-w-[248px] sm:max-w-[300px]" : "max-w-[920px]";
  const introTitle =
    theme.customWelcomeTitle ||
    artist.funnelSettings.introTitle ||
    artist.profile.welcomeHeadline ||
    "Share your tattoo idea in a few quick steps.";
  const introText =
    theme.customIntroText?.trim() ||
    artist.profile.shortBio?.trim() ||
    "";
  const ctaLabel = theme.customCtaLabel || "Start estimate";

  return (
    <ArtistPageShell theme={theme} className="rounded-[26px] sm:rounded-[32px]">
      <div className={`mx-auto w-full ${previewWidth}`}>
        <div
          className="rounded-[24px] border p-2 shadow-2xl sm:rounded-[30px] sm:p-2.5"
          style={{
            borderColor: "var(--artist-border)",
            backgroundColor: "color-mix(in srgb, var(--artist-card) 22%, transparent)",
          }}
        >
          <div
            className="overflow-hidden"
            style={{
              borderRadius: "calc(var(--artist-radius) + 2px)",
              backgroundColor: "color-mix(in srgb, var(--artist-card) 16%, transparent)",
            }}
          >
            <div
              className="h-20 border-b bg-grid sm:h-28"
              style={{
                borderColor: "var(--artist-border)",
                backgroundImage: artist.profile.coverImageUrl
                  ? `linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.55)), url(${artist.profile.coverImageUrl})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="-mt-8 space-y-3 px-3 pb-3 sm:-mt-10 sm:space-y-4 sm:px-4 sm:pb-4">
              <AvatarTile
                name={artist.profile.artistName}
                imageUrl={artist.profile.profileImageUrl}
                planType={artist.profile.planType}
              />
              <div className="space-y-3">
                <Badge variant="accent">{artist.funnelSettings.introEyebrow}</Badge>
                <h3
                  className="text-[1.2rem] leading-tight sm:text-[1.55rem]"
                  style={{
                    fontFamily: "var(--artist-heading-font)",
                    color: "var(--artist-foreground)",
                  }}
                >
                  {introTitle}
                </h3>
                {introText ? (
                  <p className="text-[11px] leading-5 sm:text-xs sm:leading-6" style={{ color: "var(--artist-muted)" }}>
                    {introText}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="inline-flex h-8 items-center justify-center rounded-full px-3 text-[11px] font-medium sm:h-10 sm:px-4 sm:text-xs"
                  style={{
                    backgroundColor: "var(--artist-primary)",
                    color: "var(--artist-primary-foreground)",
                  }}
                >
                  {ctaLabel}
                </button>
              </div>
              <Card
                className="p-3 sm:p-4"
                style={{
                  borderColor: "var(--artist-border)",
                  backgroundColor:
                    "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
                  borderRadius: "var(--artist-radius)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium sm:text-sm" style={{ color: "var(--artist-card-text)" }}>
                      What are you looking for?
                    </p>
                    <p className="mt-1 text-[10px] leading-4 sm:text-xs" style={{ color: "var(--artist-card-muted)" }}>
                      Start with the tattoo intent.
                    </p>
                  </div>
                  <Badge variant="muted" className="text-[9px] sm:text-[10px]">Step 1 / 6</Badge>
                </div>
                <div className="mt-3 grid gap-2 sm:mt-4 sm:gap-2.5">
                  {intentOptions.slice(0, 3).map((intent, index) => (
                    <button
                      key={intent.value}
                      type="button"
                      className="rounded-[18px] border px-2.5 py-2.5 text-left text-[11px] transition sm:rounded-[22px] sm:px-3 sm:py-3 sm:text-sm"
                      style={{
                        borderColor: index === 1 ? "var(--artist-primary)" : "var(--artist-border)",
                        backgroundColor:
                          index === 1
                            ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                            : "rgba(0,0,0,0.12)",
                        color: "var(--artist-card-text)",
                      }}
                    >
                      {intent.label}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ArtistPageShell>
  );
}
