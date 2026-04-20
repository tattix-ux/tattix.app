import type { BodyAreaDetailValue } from "@/lib/constants/body-placement";
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
  placementDetail?: BodyAreaDetailValue;
  colorMode: "black-only" | "black-grey" | "full-color";
  workStyle: WorkStyleValue;
  imageSlot: string;
  imagePresentation?: PricingCaseImagePresentation;
  title: Record<PublicLocale, string>;
  metaLine: Record<PublicLocale, string>;
};

export type PricingReviewCase = {
  id: string;
  requestType: RequestTypeValue;
  referenceSizeCm: number;
  placementBucket: PlacementBucket;
  placementDetail?: BodyAreaDetailValue;
  colorMode: "black-only" | "black-grey" | "full-color";
  workStyle: WorkStyleValue;
  imageSlot: string;
  imagePresentation?: PricingCaseImagePresentation;
  title: Record<PublicLocale, string>;
  metaLine: Record<PublicLocale, string>;
};

export type PricingLargeAreaCase = {
  id: string;
  imageSlot: string;
  imagePresentation?: PricingCaseImagePresentation;
  title: Record<PublicLocale, string>;
  metaLine: Record<PublicLocale, string>;
};

export type PricingWideAreaCase = {
  id: string;
  imageSlot: string;
  imagePresentation?: PricingCaseImagePresentation;
  title: Record<PublicLocale, string>;
  metaLine: Record<PublicLocale, string>;
};

export type PricingCaseImagePresentation = {
  frameClassName?: string;
  imageClassName?: string;
  fit?: "cover" | "contain";
};

const IMAGE_PRESENTATIONS: Record<
  | "text"
  | "symbol"
  | "singleObject"
  | "singleFigure"
  | "multiElement"
  | "ornamental"
  | "colorPiece"
  | "coverUp",
  PricingCaseImagePresentation
> = {
  text: {
    fit: "contain",
    frameClassName: "bg-white/[0.985] px-2.5 py-3.5",
    imageClassName: "scale-[1.56] object-center",
  },
  symbol: {
    fit: "contain",
    frameClassName: "bg-white/[0.985] px-2.5 py-2.5",
    imageClassName: "scale-[1.56] object-center",
  },
  singleObject: {
    fit: "contain",
    frameClassName: "bg-white/[0.985] px-1 py-1",
    imageClassName: "scale-[1.48] object-center",
  },
  singleFigure: {
    fit: "contain",
    frameClassName: "bg-white/[0.985] px-1.5 py-1.5",
    imageClassName: "scale-[1.3] object-center",
  },
  multiElement: {
    fit: "contain",
    frameClassName: "bg-white/[0.985] px-1.5 py-1.5",
    imageClassName: "scale-[1.2] object-center",
  },
  ornamental: {
    fit: "contain",
    frameClassName: "bg-white/[0.985] px-0.5 py-1",
    imageClassName: "scale-[1.5] object-center",
  },
  colorPiece: {
    fit: "contain",
    frameClassName: "bg-white/[0.985] px-1.5 py-1.5",
    imageClassName: "scale-[1.24] object-center",
  },
  coverUp: {
    fit: "contain",
    frameClassName: "bg-white/[0.985] px-1 py-1",
    imageClassName: "scale-[1.4] object-center",
  },
};

export const PRICING_V2_SIZE_SERIES_CASE_IDS = [
  "object-6cm-forearm",
  "object-10cm-forearm",
  "object-16cm-forearm",
] as const;

export const PRICING_V2_SPECIAL_CASE_IDS = [
  "single-figure-12cm-upper-arm",
  "ornamental-small-hard",
  "medium-color-piece",
  "small-cover-up",
] as const;

export const PRICING_V2_LARGE_AREA_CASE_IDS = [
  "forearm-large-coverage",
  "calf-large-coverage",
  "chest-large-coverage",
] as const;

export const PRICING_V2_WIDE_AREA_CASE_IDS = [
  "half-sleeve",
  "full-sleeve",
  "back-large-coverage",
] as const;

export const PRICING_V2_ONBOARDING_CASES: PricingOnboardingCase[] = [
  {
    id: "object-6cm-forearm",
    requestType: "single_object",
    referenceSizeCm: 6,
    placementBucket: "easy",
    placementDetail: "forearm-outer",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: singleObjectImage.src,
    imagePresentation: IMAGE_PRESENTATIONS.singleObject,
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
    placementDetail: "forearm-outer",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: singleObjectImage.src,
    imagePresentation: IMAGE_PRESENTATIONS.singleObject,
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
    placementDetail: "forearm-outer",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: singleObjectImage.src,
    imagePresentation: IMAGE_PRESENTATIONS.singleObject,
    title: { tr: "16 cm tek obje", en: "16 cm single object" },
    metaLine: {
      tr: "Ön kol · sadece siyah · sade çizgisel",
      en: "Forearm · black only · simple linework",
    },
  },
  {
    id: "single-figure-12cm-upper-arm",
    requestType: "single_object",
    referenceSizeCm: 12,
    placementBucket: "easy",
    placementDetail: "upper-arm-outer",
    colorMode: "black-grey",
    workStyle: "shaded_detailed",
    imageSlot: singleFigureImage.src,
    imagePresentation: IMAGE_PRESENTATIONS.singleFigure,
    title: { tr: "12 cm tek figür", en: "12 cm single figure" },
    metaLine: {
      tr: "Üst kol · siyah-gri · daha dolu / gölgeli",
      en: "Upper arm · black-grey · fuller / shaded",
    },
  },
  {
    id: "ornamental-small-hard",
    requestType: "multi_element",
    referenceSizeCm: 8,
    placementBucket: "hard",
    placementDetail: "chest-center",
    colorMode: "black-only",
    workStyle: "precision_symmetric",
    imageSlot: ornamentalImage.src,
    imagePresentation: IMAGE_PRESENTATIONS.ornamental,
    title: { tr: "Küçük düzenli parça", en: "Small structured piece" },
    metaLine: {
      tr: "Sternum · sadece siyah · geometrik / ornamental",
      en: "Sternum · black only · geometric / ornamental",
    },
  },
  {
    id: "medium-color-piece",
    requestType: "single_object",
    referenceSizeCm: 11,
    placementBucket: "easy",
    placementDetail: "upper-arm-outer",
    colorMode: "full-color",
    workStyle: "shaded_detailed",
    imageSlot: colorPieceImage.src,
    imagePresentation: IMAGE_PRESENTATIONS.colorPiece,
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
    placementDetail: "forearm-outer",
    colorMode: "black-only",
    workStyle: "shaded_detailed",
    imageSlot: coverUpImage.src,
    imagePresentation: IMAGE_PRESENTATIONS.coverUp,
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
    referenceSizeCm: 4,
    placementBucket: "standard",
    placementDetail: "wrist",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: textWordImage.src,
    imagePresentation: IMAGE_PRESENTATIONS.text,
    title: { tr: "4 cm kısa yazı", en: "4 cm short text" },
    metaLine: {
      tr: "Bilek · sadece siyah · sade font",
      en: "Wrist · black only · simple font",
    },
  },
  {
    id: "review-mini",
    requestType: "mini_simple",
    referenceSizeCm: 4,
    placementBucket: "easy",
    placementDetail: "ankle",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: smallSymbolImage.src,
    imagePresentation: IMAGE_PRESENTATIONS.symbol,
    title: { tr: "4 cm minimal sembol", en: "4 cm minimal symbol" },
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
    placementDetail: "forearm-outer",
    colorMode: "black-only",
    workStyle: "clean_line",
    imageSlot: singleObjectImage.src,
    imagePresentation: IMAGE_PRESENTATIONS.singleObject,
    title: { tr: "16 cm tek obje", en: "16 cm single object" },
    metaLine: {
      tr: "Ön kol · sadece siyah · sade çizgisel",
      en: "Forearm · black only · simple linework",
    },
  },
  {
    id: "review-multi",
    requestType: "multi_element",
    referenceSizeCm: 15,
    placementBucket: "standard",
    placementDetail: "calf",
    colorMode: "black-only",
    workStyle: "shaded_detailed",
    imageSlot: multiElementImage.src,
    imagePresentation: IMAGE_PRESENTATIONS.multiElement,
    title: { tr: "15 cm çok öğeli iş", en: "15 cm multi-element piece" },
    metaLine: {
      tr: "Baldır · sadece siyah · çok öğeli kompozisyon",
      en: "Calf · black only · multi-element composition",
    },
  },
  {
    id: "review-cover",
    requestType: "cover_up",
    referenceSizeCm: 8,
    placementBucket: "standard",
    placementDetail: "forearm-outer",
    colorMode: "black-only",
    workStyle: "shaded_detailed",
    imageSlot: coverUpImage.src,
    imagePresentation: IMAGE_PRESENTATIONS.coverUp,
    title: { tr: "Küçük cover-up", en: "Small cover-up" },
    metaLine: {
      tr: "Ön kol · siyah ağırlıklı · kapatma",
      en: "Forearm · mostly black · covering a small tattoo",
    },
  },
] as const;

export const PRICING_V2_LARGE_AREA_CASES: PricingLargeAreaCase[] = [
  {
    id: "forearm-large-coverage",
    imageSlot: "",
    title: { tr: "Ön kolun büyük kısmını kaplayan iş", en: "Piece covering most of the forearm" },
    metaLine: {
      tr: "Siyah-gri · daha dolu / gölgeli",
      en: "Black-grey · fuller / shaded",
    },
  },
  {
    id: "calf-large-coverage",
    imageSlot: "",
    title: { tr: "Baldırın büyük kısmını kaplayan iş", en: "Piece covering most of the calf" },
    metaLine: {
      tr: "Sadece siyah · daha düzenli / simetrik",
      en: "Black only · more structured / symmetrical",
    },
  },
  {
    id: "chest-large-coverage",
    imageSlot: "",
    title: { tr: "Göğüste büyük alan kaplayan iş", en: "Large coverage piece on the chest" },
    metaLine: {
      tr: "Siyah-gri · daha dolu / gölgeli",
      en: "Black-grey · fuller / shaded",
    },
  },
] as const;

export const PRICING_V2_WIDE_AREA_CASES: PricingWideAreaCase[] = [
  {
    id: "half-sleeve",
    imageSlot: "",
    title: { tr: "Kolun yarısını kaplayan iş", en: "Piece covering half the arm" },
    metaLine: {
      tr: "Siyah-gri · daha dolu / gölgeli",
      en: "Black-grey · fuller / shaded",
    },
  },
  {
    id: "full-sleeve",
    imageSlot: "",
    title: { tr: "Tüm kolu kaplayan iş", en: "Piece covering the full arm" },
    metaLine: {
      tr: "Siyah-gri · daha dolu / gölgeli",
      en: "Black-grey · fuller / shaded",
    },
  },
  {
    id: "back-large-coverage",
    imageSlot: "",
    title: { tr: "Sırtta geniş alan kaplayan iş", en: "Large coverage piece on the back" },
    metaLine: {
      tr: "Siyah-gri · daha dolu / gölgeli",
      en: "Black-grey · fuller / shaded",
    },
  },
] as const;
