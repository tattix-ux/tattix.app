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
  const previewWidth = device === "mobile" ? "max-w-[390px]" : "max-w-[920px]";
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
          className="rounded-[36px] border p-3 shadow-2xl"
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
              className="h-40 border-b bg-grid"
              style={{
                borderColor: "var(--artist-border)",
                backgroundImage: artist.profile.coverImageUrl
                  ? `linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.55)), url(${artist.profile.coverImageUrl})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="-mt-12 space-y-5 px-5 pb-5">
              <AvatarTile
                name={artist.profile.artistName}
                imageUrl={artist.profile.profileImageUrl}
              />
              <div className="space-y-3">
                <Badge variant="accent">{artist.funnelSettings.introEyebrow}</Badge>
                <h3
                  className="text-3xl leading-tight"
                  style={{
                    fontFamily: "var(--artist-heading-font)",
                    color: "var(--artist-foreground)",
                  }}
                >
                  {introTitle}
                </h3>
                <p className="text-sm leading-7" style={{ color: "var(--artist-muted)" }}>
                  {introText}
                </p>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium"
                  style={{
                    backgroundColor: "var(--artist-primary)",
                    color: "var(--artist-primary-foreground)",
                  }}
                >
                  {ctaLabel}
                </button>
              </div>
              <Card
                className="p-5"
                style={{
                  borderColor: "var(--artist-border)",
                  backgroundColor:
                    "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
                  borderRadius: "var(--artist-radius)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium" style={{ color: "var(--artist-card-text)" }}>
                      What are you looking for?
                    </p>
                    <p className="mt-1 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                      Start with the tattoo intent.
                    </p>
                  </div>
                  <Badge variant="muted">Step 1 / 6</Badge>
                </div>
                <div className="mt-4 grid gap-3">
                  {intentOptions.slice(0, 3).map((intent, index) => (
                    <button
                      key={intent.value}
                      type="button"
                      className="rounded-[24px] border px-4 py-4 text-left transition"
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
