import type { PublicLocale } from "@/lib/i18n/public";
import type { RequestTypeValue } from "@/lib/constants/options";
import type { WorkStyleValue } from "@/lib/types";
import type { PlacementBucket } from "./types";
import textWordImage from "@/sample-tattoos/pricing-text-word.png";
import smallSymbolImage from "@/sample-tattoos/pricing-small-symbol.png";
import singleObjectImage from "@/sample-tattoos/pricing-single-object.png";
import singleFigureImage from "@/sample-tattoos/pricing-single-figure.png";
import multiElementImage from "@/sample-tattoos/pricing-multi-element.png";
import ornamentalImage from "@/sample-tattoos/pricing-ornamental-small.png";
import colorPieceImage from "@/sample-tattoos/pricing-color-piece.png";
import coverUpImage from "@/sample-tattoos/pricing-cover-up.png";

export type PricingOnboardingCase = {
  id: string;
  requestType: RequestTypeValue;
  referenceSizeCm: number;
  placementBucket: PlacementBucket;
  colorMode: "black-only" | "black-grey" | "full-color";
  workStyle: WorkStyleValue;
  imageSlot: string;
  title: Record<PublicLocale, string>;
  metaLine: Record<PublicLocale, string>;
};

export type PricingReviewCase = {
  id: string;
  requestType: RequestTypeValue;
  referenceSizeCm: number;
  placementBucket: PlacementBucket;
  colorMode: "black-only" | "black-grey" | "full-color";
  workStyle: WorkStyleValue;
  imageSlot: string;
  title: Record<PublicLocale, string>;
  metaLine: Record<PublicLocale, string>;
};

export const PRICING_V2_SIZE_SERIES_CASE_IDS = [
  "object-6cm-forearm",
  "object-10cm-forearm",
  "object-16cm-forearm",
] as const;

export const PRICING_V2_ONBOARDING_CASES: PricingOnboardingCase[] = [
  {
    id: "text-4cm-wrist",
    requestType: "text",
    referenceSizeCm: 4,
    placementBucket: "standard",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: textWordImage.src,
    title: { tr: "4 cm tek kelime yazı", en: "4 cm single word" },
    metaLine: {
      tr: "Bilek · sadece siyah · sade font",
      en: "Wrist · black only · simple font",
    },
  },
  {
    id: "symbol-4cm-ankle",
    requestType: "mini_simple",
    referenceSizeCm: 4,
    placementBucket: "standard",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: smallSymbolImage.src,
    title: { tr: "4 cm küçük sembol", en: "4 cm small symbol" },
    metaLine: {
      tr: "Ayak bileği · sadece siyah · sade çizgisel",
      en: "Ankle · black only · simple linework",
    },
  },
  {
    id: "object-6cm-forearm",
    requestType: "single_object",
    referenceSizeCm: 6,
    placementBucket: "easy",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: singleObjectImage.src,
    title: { tr: "6 cm tek obje", en: "6 cm single object" },
    metaLine: {
      tr: "Ön kol · sadece siyah · sade çizgisel",
      en: "Forearm · black only · simple linework",
    },
  },
  {
    id: "object-10cm-forearm",
    requestType: "single_object",
    referenceSizeCm: 10,
    placementBucket: "easy",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: singleObjectImage.src,
    title: { tr: "10 cm tek obje", en: "10 cm single object" },
    metaLine: {
      tr: "Ön kol · sadece siyah · sade çizgisel",
      en: "Forearm · black only · simple linework",
    },
  },
  {
    id: "object-16cm-forearm",
    requestType: "single_object",
    referenceSizeCm: 16,
    placementBucket: "easy",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: singleObjectImage.src,
    title: { tr: "16 cm tek obje", en: "16 cm single object" },
    metaLine: {
      tr: "Ön kol · sadece siyah · sade çizgisel",
      en: "Forearm · black only · simple linework",
    },
  },
  {
    id: "ornamental-small-hard",
    requestType: "multi_element",
    referenceSizeCm: 8,
    placementBucket: "hard",
    colorMode: "black-only",
    workStyle: "precision_symmetric",
    imageSlot: ornamentalImage.src,
    title: { tr: "Küçük ornamental parça", en: "Small ornamental piece" },
    metaLine: {
      tr: "Sternum · sadece siyah · simetri ve hassasiyet önemli",
      en: "Sternum · black only · symmetry and precision matter",
    },
  },
  {
    id: "medium-color-piece",
    requestType: "single_object",
    referenceSizeCm: 11,
    placementBucket: "easy",
    colorMode: "full-color",
    workStyle: "shaded_detailed",
    imageSlot: colorPieceImage.src,
    title: { tr: "10–12 cm renkli parça", en: "10–12 cm color piece" },
    metaLine: {
      tr: "Üst kol · renkli · orta yoğunluk",
      en: "Upper arm · color · medium density",
    },
  },
  {
    id: "small-cover-up",
    requestType: "cover_up",
    referenceSizeCm: 7,
    placementBucket: "standard",
    colorMode: "black-only",
    workStyle: "shaded_detailed",
    imageSlot: coverUpImage.src,
    title: { tr: "Küçük cover-up", en: "Small cover-up" },
    metaLine: {
      tr: "Ön kol · siyah ağırlıklı · mevcut küçük dövmeyi kapatma",
      en: "Forearm · mostly black · covering a small existing tattoo",
    },
  },
] as const;

export const PRICING_V2_REVIEW_CASES: PricingReviewCase[] = [
  {
    id: "review-text",
    requestType: "text",
    referenceSizeCm: 5,
    placementBucket: "standard",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: textWordImage.src,
    title: { tr: "Kısa yazı", en: "Short text" },
    metaLine: {
      tr: "Bilek · sadece siyah · sade font",
      en: "Wrist · black only · simple font",
    },
  },
  {
    id: "review-mini",
    requestType: "mini_simple",
    referenceSizeCm: 5,
    placementBucket: "easy",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: smallSymbolImage.src,
    title: { tr: "Minimal sembol", en: "Minimal symbol" },
    metaLine: {
      tr: "Ayak bileği · sadece siyah · sade çizgisel",
      en: "Ankle · black only · simple linework",
    },
  },
  {
    id: "review-single-large",
    requestType: "single_object",
    referenceSizeCm: 16,
    placementBucket: "easy",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: singleFigureImage.src,
    title: { tr: "16 cm tek obje", en: "16 cm single object" },
    metaLine: {
      tr: "Ön kol · sadece siyah · sade çizgisel",
      en: "Forearm · black only · simple linework",
    },
  },
  {
    id: "review-multi",
    requestType: "multi_element",
    referenceSizeCm: 16,
    placementBucket: "standard",
    colorMode: "black-only",
    workStyle: "shaded_detailed",
    imageSlot: multiElementImage.src,
    title: { tr: "Birden fazla öğeli iş", en: "Multi-element piece" },
    metaLine: {
      tr: "Baldır · sadece siyah · çok öğeli",
      en: "Calf · black only · multi-element",
    },
  },
  {
    id: "review-cover",
    requestType: "cover_up",
    referenceSizeCm: 8,
    placementBucket: "standard",
    colorMode: "black-only",
    workStyle: "shaded_detailed",
    imageSlot: coverUpImage.src,
    title: { tr: "Küçük cover-up", en: "Small cover-up" },
    metaLine: {
      tr: "Ön kol · siyah ağırlıklı · kapatma",
      en: "Forearm · mostly black · cover-up",
    },
  },
] as const;
