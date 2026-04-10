"use client";

import { useMemo, useSyncExternalStore } from "react";

import { PublicArtistContent } from "@/components/artist-page/public-artist-content";
import { ArtistPageShell } from "@/components/artist-page/artist-page-shell";
import { Container } from "@/components/shared/shell";
import {
  loadDemoThemeSnapshot,
  parseDemoThemeSnapshot,
  subscribeDemoTheme,
} from "@/lib/demo-theme-storage";
import type { ArtistPageData } from "@/lib/types";

export function DemoArtistPage({ artist }: { artist: ArtistPageData }) {
  const storedThemeSnapshot = useSyncExternalStore(
    subscribeDemoTheme,
    loadDemoThemeSnapshot,
    () => null,
  );
  const storedTheme = useMemo(
    () => parseDemoThemeSnapshot(storedThemeSnapshot),
    [storedThemeSnapshot],
  );

  const themedArtist = {
    ...artist,
    pageTheme: storedTheme
      ? {
          ...storedTheme,
          artistId: artist.profile.id,
        }
      : artist.pageTheme,
  };

  return (
    <ArtistPageShell theme={themedArtist.pageTheme}>
      <Container className="min-w-0 max-w-full overflow-x-clip px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto w-full min-w-0 max-w-3xl">
          <PublicArtistContent artist={themedArtist} />
        </div>
      </Container>
    </ArtistPageShell>
  );
}
