import type { PublicLocale } from "@/lib/i18n/public";
import type { RequestTypeValue } from "@/lib/constants/options";
import type { PlacementBucket } from "./types";

export type PricingOnboardingCase = {
  id: string;
  requestType: RequestTypeValue;
  referenceSizeCm: number;
  placementBucket: PlacementBucket;
  colorMode: "black-only" | "black-grey" | "full-color";
  imageSlot: string;
  title: Record<PublicLocale, string>;
  description: Record<PublicLocale, string>;
};

export type PricingReviewCase = {
  id: string;
  requestType: RequestTypeValue;
  referenceSizeCm: number;
  placementBucket: PlacementBucket;
  colorMode: "black-only" | "black-grey" | "full-color";
  imageSlot: string;
  title: Record<PublicLocale, string>;
};

export const PRICING_V2_ONBOARDING_CASES: PricingOnboardingCase[] = [
  {
    id: "text-4cm-wrist",
    requestType: "text",
    referenceSizeCm: 4,
    placementBucket: "standard",
    colorMode: "black-only",
    imageSlot: "sample-tattoos/pricing-v2/onboarding/text-4cm-wrist.png",
    title: { tr: "4 cm tek kelime yazı, bilek", en: "4 cm single word, wrist" },
    description: {
      tr: "Müşteriye hangi başlangıç bandını göstermek istersin?",
      en: "Which starting band would you show the client?",
    },
  },
  {
    id: "symbol-4cm-ankle",
    requestType: "mini_simple",
    referenceSizeCm: 4,
    placementBucket: "standard",
    colorMode: "black-only",
    imageSlot: "sample-tattoos/pricing-v2/onboarding/symbol-4cm-ankle.png",
    title: { tr: "4 cm küçük sembol, ayak bileği", en: "4 cm small symbol, ankle" },
    description: { tr: "Müşteriye hangi başlangıç bandını göstermek istersin?", en: "Which starting band would you show the client?" },
  },
  {
    id: "object-8cm-forearm",
    requestType: "single_object",
    referenceSizeCm: 8,
    placementBucket: "easy",
    colorMode: "black-only",
    imageSlot: "sample-tattoos/pricing-v2/onboarding/object-8cm-forearm.png",
    title: { tr: "8 cm basit tek obje, ön kol", en: "8 cm simple single object, forearm" },
    description: { tr: "Müşteriye hangi başlangıç bandını göstermek istersin?", en: "Which starting band would you show the client?" },
  },
  {
    id: "figure-12cm-upper-arm",
    requestType: "single_object",
    referenceSizeCm: 12,
    placementBucket: "easy",
    colorMode: "black-only",
    imageSlot: "sample-tattoos/pricing-v2/onboarding/figure-12cm-upper-arm.png",
    title: { tr: "12 cm tek figür, üst kol", en: "12 cm single figure, upper arm" },
    description: { tr: "Müşteriye hangi başlangıç bandını göstermek istersin?", en: "Which starting band would you show the client?" },
  },
  {
    id: "multi-15cm-calf",
    requestType: "multi_element",
    referenceSizeCm: 15,
    placementBucket: "standard",
    colorMode: "black-only",
    imageSlot: "sample-tattoos/pricing-v2/onboarding/multi-15cm-calf.png",
    title: { tr: "15 cm birden fazla öğeli tasarım, baldır", en: "15 cm multi-element design, calf" },
    description: { tr: "Müşteriye hangi başlangıç bandını göstermek istersin?", en: "Which starting band would you show the client?" },
  },
  {
    id: "ornamental-small-hard",
    requestType: "multi_element",
    referenceSizeCm: 8,
    placementBucket: "hard",
    colorMode: "black-only",
    imageSlot: "sample-tattoos/pricing-v2/onboarding/ornamental-small-hard.png",
    title: {
      tr: "Küçük hassas ornamental iş, sternum / zor alan",
      en: "Small sensitive ornamental piece, sternum / hard area",
    },
    description: { tr: "Müşteriye hangi başlangıç bandını göstermek istersin?", en: "Which starting band would you show the client?" },
  },
  {
    id: "medium-color-piece",
    requestType: "single_object",
    referenceSizeCm: 14,
    placementBucket: "easy",
    colorMode: "full-color",
    imageSlot: "sample-tattoos/pricing-v2/onboarding/medium-color-piece.png",
    title: { tr: "Orta boy renkli iş", en: "Medium-size color piece" },
    description: { tr: "Müşteriye hangi başlangıç bandını göstermek istersin?", en: "Which starting band would you show the client?" },
  },
  {
    id: "small-cover-up",
    requestType: "cover_up",
    referenceSizeCm: 7,
    placementBucket: "standard",
    colorMode: "black-only",
    imageSlot: "sample-tattoos/pricing-v2/onboarding/small-cover-up.png",
    title: { tr: "Küçük cover-up işi", en: "Small cover-up job" },
    description: { tr: "Müşteriye hangi başlangıç bandını göstermek istersin?", en: "Which starting band would you show the client?" },
  },
] as const;

export const PRICING_V2_REVIEW_CASES: PricingReviewCase[] = [
  {
    id: "review-text",
    requestType: "text",
    referenceSizeCm: 5,
    placementBucket: "standard",
    colorMode: "black-only",
    imageSlot: "sample-tattoos/pricing-v2/review/review-text.png",
    title: { tr: "Kısa yazı", en: "Short text" },
  },
  {
    id: "review-mini",
    requestType: "mini_simple",
    referenceSizeCm: 5,
    placementBucket: "easy",
    colorMode: "black-only",
    imageSlot: "sample-tattoos/pricing-v2/review/review-mini.png",
    title: { tr: "Minimal sembol", en: "Minimal symbol" },
  },
  {
    id: "review-single",
    requestType: "single_object",
    referenceSizeCm: 11,
    placementBucket: "easy",
    colorMode: "black-grey",
    imageSlot: "sample-tattoos/pricing-v2/review/review-single.png",
    title: { tr: "Tek obje", en: "Single object" },
  },
  {
    id: "review-multi",
    requestType: "multi_element",
    referenceSizeCm: 16,
    placementBucket: "standard",
    colorMode: "black-only",
    imageSlot: "sample-tattoos/pricing-v2/review/review-multi.png",
    title: { tr: "Birden fazla öğeli iş", en: "Multi-element piece" },
  },
  {
    id: "review-cover",
    requestType: "cover_up",
    referenceSizeCm: 8,
    placementBucket: "hard",
    colorMode: "black-only",
    imageSlot: "sample-tattoos/pricing-v2/review/review-cover.png",
    title: { tr: "Küçük cover-up", en: "Small cover-up" },
  },
] as const;
