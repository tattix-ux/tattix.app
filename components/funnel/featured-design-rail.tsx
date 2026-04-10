import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getFeaturedCategoryLabel, getPublicCopy, type PublicLocale } from "@/lib/i18n/public";
import type { ArtistFeaturedDesign } from "@/lib/types";
import { formatCompactCurrencyRange } from "@/lib/utils";

export function FeaturedDesignRail({
  designs,
  currency,
  eyebrowLabel,
  titleLabel,
  locale = "en",
}: {
  designs: ArtistFeaturedDesign[];
  currency: string;
  eyebrowLabel?: string | null;
  titleLabel?: string | null;
  locale?: PublicLocale;
}) {
  if (designs.length === 0) {
    return null;
  }

  const copy = getPublicCopy(locale);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
            {eyebrowLabel || copy.featuredEyebrow}
          </p>
          <h3
            className="mt-2 text-2xl"
            style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-foreground)" }}
          >
            {titleLabel || copy.featuredTitle}
          </h3>
        </div>
      </div>
      <div className="flex w-full max-w-full snap-x gap-4 overflow-x-auto pb-2">
        {designs.map((design) => (
          <Card
            key={design.id}
            className="w-[85vw] max-w-[270px] flex-none snap-start p-5"
            style={{
              borderColor: "var(--artist-border)",
              backgroundColor:
                "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
              borderRadius: "var(--artist-radius)",
            }}
          >
            <div
              className="flex h-36 items-end overflow-hidden p-4"
              style={{
                borderRadius: "calc(var(--artist-radius) - 8px)",
                border: "1px solid var(--artist-border)",
                background: design.imageUrl
                  ? `linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.55)), url(${design.imageUrl}) center / cover`
                  : "linear-gradient(135deg, color-mix(in srgb, var(--artist-primary) 24%, transparent), rgba(255,255,255,0.04), rgba(0,0,0,0.4))",
              }}
            >
              <Badge variant="accent">
                {getFeaturedCategoryLabel(design.category, locale)}
              </Badge>
            </div>
            <h4 className="mt-4 text-lg font-semibold" style={{ color: "var(--artist-card-text)" }}>
              {design.title}
            </h4>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
              {design.shortDescription}
            </p>
            {design.priceNote ? (
              <p className="mt-4 text-sm" style={{ color: "var(--artist-primary)" }}>
                {design.priceNote}
              </p>
            ) : design.referencePriceMin && design.referencePriceMax ? (
              <p className="mt-4 text-sm" style={{ color: "var(--artist-primary)" }}>
                {formatCompactCurrencyRange(
                  design.referencePriceMin,
                  design.referencePriceMax,
                  currency,
                )}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
