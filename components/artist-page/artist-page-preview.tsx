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
  const previewWidth = device === "mobile" ? "max-w-[312px] sm:max-w-[340px]" : "max-w-[920px]";
  const introTitle =
    theme.customWelcomeTitle ||
    artist.funnelSettings.introTitle ||
    artist.profile.welcomeHeadline ||
    "Share your tattoo idea in a few quick steps.";
  const introText =
    theme.customIntroText ||
    artist.profile.shortBio ||
    artist.funnelSettings.introDescription ||
    "Choose the placement, size, and style to preview the intake flow.";
  const ctaLabel = theme.customCtaLabel || "Start estimate";

  return (
    <ArtistPageShell theme={theme} className="rounded-[32px]">
      <div className={`mx-auto w-full ${previewWidth}`}>
        <div
          className="rounded-[30px] border p-2.5 shadow-2xl sm:rounded-[36px] sm:p-3"
          style={{
            borderColor: "var(--artist-border)",
            backgroundColor: "color-mix(in srgb, var(--artist-card) 35%, transparent)",
          }}
        >
          <div
            className="overflow-hidden"
            style={{
              borderRadius: "calc(var(--artist-radius) + 6px)",
              backgroundColor: "color-mix(in srgb, var(--artist-card) 24%, transparent)",
            }}
          >
            <div
              className="h-28 border-b bg-grid sm:h-36"
              style={{
                borderColor: "var(--artist-border)",
                backgroundImage: artist.profile.coverImageUrl
                  ? `linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.55)), url(${artist.profile.coverImageUrl})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="-mt-10 space-y-4 px-4 pb-4 sm:-mt-12 sm:space-y-5 sm:px-5 sm:pb-5">
              <AvatarTile
                name={artist.profile.artistName}
                imageUrl={artist.profile.profileImageUrl}
                planType={artist.profile.planType}
              />
              <div className="space-y-3">
                <Badge variant="accent">{artist.funnelSettings.introEyebrow}</Badge>
                <h3
                  className="text-[1.55rem] leading-tight sm:text-3xl"
                  style={{
                    fontFamily: "var(--artist-heading-font)",
                    color: "var(--artist-foreground)",
                  }}
                >
                  {introTitle}
                </h3>
                <p className="text-xs leading-6 sm:text-sm sm:leading-7" style={{ color: "var(--artist-muted)" }}>
                  {introText}
                </p>
                <button
                  type="button"
                  className="inline-flex h-10 items-center justify-center rounded-full px-4 text-xs font-medium sm:h-11 sm:px-5 sm:text-sm"
                  style={{
                    backgroundColor: "var(--artist-primary)",
                    color: "var(--artist-primary-foreground)",
                  }}
                >
                  {ctaLabel}
                </button>
              </div>
              <Card
                className="p-4 sm:p-5"
                style={{
                  borderColor: "var(--artist-border)",
                  backgroundColor:
                    "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
                  borderRadius: "var(--artist-radius)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium sm:text-base" style={{ color: "var(--artist-card-text)" }}>
                      What are you looking for?
                    </p>
                    <p className="mt-1 text-xs sm:text-sm" style={{ color: "var(--artist-card-muted)" }}>
                      Start with the tattoo intent.
                    </p>
                  </div>
                  <Badge variant="muted">Step 1 / 6</Badge>
                </div>
                <div className="mt-4 grid gap-2.5 sm:gap-3">
                  {intentOptions.slice(0, 3).map((intent, index) => (
                    <button
                      key={intent.value}
                      type="button"
                      className="rounded-[22px] border px-3 py-3 text-left text-sm transition sm:px-4 sm:py-4"
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
