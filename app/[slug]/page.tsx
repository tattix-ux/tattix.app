import { notFound } from "next/navigation";

import { DemoArtistPage } from "@/components/artist-page/demo-artist-page";
import { ArtistPageShell } from "@/components/artist-page/artist-page-shell";
import { PublicArtistContent } from "@/components/artist-page/public-artist-content";
import { Container } from "@/components/shared/shell";
import { siteConfig } from "@/lib/config/site";
import { getPublicArtistPageData } from "@/lib/data/artist";

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug === "dashboard" || slug === "login" || slug === "signup") {
    notFound();
  }

  const artist = await getPublicArtistPageData(slug);

  if (slug === siteConfig.demoSlug) {
    return <DemoArtistPage artist={artist} />;
  }

  return (
    <ArtistPageShell theme={artist.pageTheme}>
      <Container className="px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto w-full min-w-0 max-w-3xl">
          <PublicArtistContent artist={artist} />
        </div>
      </Container>
    </ArtistPageShell>
  );
}
