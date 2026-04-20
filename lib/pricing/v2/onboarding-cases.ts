import type { BodyAreaDetailValue } from "@/lib/constants/body-placement";
import type { PublicLocale } from "@/lib/i18n/public";
import type { RealismLevelValue, RequestTypeValue } from "@/lib/constants/options";
import type { WorkStyleValue } from "@/lib/types";
import type { PlacementBucket } from "./types";
import reviewTextWordImage from "@/sample-tattoos/final-control/pricing-text-word.png";
import reviewSmallSymbolImage from "@/sample-tattoos/final-control/pricing-small-symbol.png";
import reviewSingleObjectImage from "@/sample-tattoos/final-control/Tekobje.png";
import reviewMultiElementImage from "@/sample-tattoos/final-control/pricing-multi-element.png";
import reviewSmallCoverUpImage from "@/sample-tattoos/final-control/pricing-small-cover-up.png";
import reviewColorPieceImage from "@/sample-tattoos/final-control/cherry-blossom.png";
import ornamentalImage from "@/sample-tattoos/pricing-ornamental-small.png";
import colorPieceImage from "@/sample-tattoos/pricing-color-piece.png";
import coverUpImage from "@/sample-tattoos/pricing-cover-up.png";
import singleFigureImage from "@/sample-tattoos/pricing-single-figure.png";
import singleObjectImage from "@/sample-tattoos/pricing-single-object.png";
import advancedRealismImage from "@/sample-tattoos/pricing-statue.png";

export type PricingOnboardingCase = {
  id: string;
  requestType: RequestTypeValue;
  referenceSizeCm: number;
  placementBucket: PlacementBucket;
  placementDetail?: BodyAreaDetailValue;
  colorMode: "black-only" | "black-grey" | "full-color";
  workStyle: WorkStyleValue;
  coverUp: boolean;
  realismLevel?: RealismLevelValue | null;
  imageSlot: string;
  imagePresentation?: PricingCaseImagePresentation;
  title: Record<PublicLocale, string>;
  metaLine: Record<PublicLocale, string>;
  description?: Record<PublicLocale, string>;
};

export type PricingReviewCase = {
  id: string;
  requestType: RequestTypeValue;
  referenceSizeCm: number;
  placementBucket: PlacementBucket;
  placementDetail?: BodyAreaDetailValue;
  colorMode: "black-only" | "black-grey" | "full-color";
  workStyle: WorkStyleValue;
  coverUp: boolean;
  realismLevel?: RealismLevelValue | null;
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

const CALIBRATION_IMAGE_SLOTS = {
  singleObject: singleObjectImage.src,
  singleFigure: singleFigureImage.src,
  ornamental: ornamentalImage.src,
  colorPiece: colorPieceImage.src,
  coverUp: coverUpImage.src,
  advancedRealism: advancedRealismImage.src,
} as const;

const FINAL_CONTROL_IMAGE_SLOTS = {
  textWord: reviewTextWordImage.src,
  smallSymbol: reviewSmallSymbolImage.src,
  singleObject: reviewSingleObjectImage.src,
  multiElement: reviewMultiElementImage.src,
  coverUp: reviewSmallCoverUpImage.src,
  colorPiece: reviewColorPieceImage.src,
} as const;

const IMAGE_PRESENTATIONS: Record<
  | "text"
  | "symbol"
  | "singleObject"
  | "singleFigure"
  | "multiElement"
  | "ornamental"
  | "colorPiece"
  | "coverUp"
  | "advancedRealism",
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
  advancedRealism: {
    fit: "contain",
    frameClassName: "bg-white/[0.985] px-1 py-1",
    imageClassName: "scale-[1.28] object-center",
  },
};

export const PRICING_V2_SIZE_SERIES_CASE_IDS = [
  "object-6cm-forearm",
  "object-10cm-forearm",
  "object-16cm-forearm",
] as const;

export const PRICING_V2_SPECIAL_CASE_IDS = [
  "single-figure-12cm-upper-arm",
  "advanced-realism-black-grey",
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
    coverUp: false,
    imageSlot: CALIBRATION_IMAGE_SLOTS.singleObject,
    imagePresentation: IMAGE_PRESENTATIONS.singleObject,
    title: { tr: "Tek obje", en: "Single object" },
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
    coverUp: false,
    imageSlot: CALIBRATION_IMAGE_SLOTS.singleObject,
    imagePresentation: IMAGE_PRESENTATIONS.singleObject,
    title: { tr: "Tek obje", en: "Single object" },
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
    coverUp: false,
    imageSlot: CALIBRATION_IMAGE_SLOTS.singleObject,
    imagePresentation: IMAGE_PRESENTATIONS.singleObject,
    title: { tr: "Tek obje", en: "Single object" },
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
    coverUp: false,
    realismLevel: "standard",
    imageSlot: CALIBRATION_IMAGE_SLOTS.singleFigure,
    imagePresentation: IMAGE_PRESENTATIONS.singleFigure,
    title: { tr: "Tek figürlü gölgeli parça", en: "Shaded single-figure piece" },
    metaLine: {
      tr: "Üst kol · siyah-gri · tek figür, gölgeli",
      en: "Upper arm · black-grey · single figure, shaded",
    },
    description: {
      tr: "Tek figürlü, orta seviye gölgeli bir iş düşün. Yoğun realistic örnekten daha hafif kalır.",
      en: "Think of a single-figure piece with moderate shading. It should stay lighter than the dense realistic example.",
    },
  },
  {
    id: "advanced-realism-black-grey",
    requestType: "single_object",
    referenceSizeCm: 11,
    placementBucket: "easy",
    placementDetail: "upper-arm-outer",
    colorMode: "black-grey",
    workStyle: "shaded_detailed",
    coverUp: false,
    realismLevel: "advanced",
    imageSlot: CALIBRATION_IMAGE_SLOTS.advancedRealism,
    imagePresentation: IMAGE_PRESENTATIONS.advancedRealism,
    title: { tr: "Yoğun realistic black-grey parça", en: "Dense realistic black-grey piece" },
    metaLine: {
      tr: "Üst kol · siyah-gri · yoğun realistic gölge",
      en: "Upper arm · black-grey · dense realistic shading",
    },
    description: {
      tr: "Tek ana figürlü, yoğun gölgeli, realistik siyah-gri bir iş düşün. Bu örnek, standart gölgeli işlerden daha ileri teknik yoğunluğu temsil eder.",
      en: "Think of a single-subject black-grey piece with dense realistic shading. This represents a higher technical load than a standard shaded piece.",
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
    coverUp: false,
    imageSlot: CALIBRATION_IMAGE_SLOTS.ornamental,
    imagePresentation: IMAGE_PRESENTATIONS.ornamental,
    title: { tr: "Küçük düzenli kompozisyon", en: "Small structured composition" },
    metaLine: {
      tr: "Göğüs · sadece siyah · geometrik, ornamental",
      en: "Sternum · black only · geometric / ornamental",
    },
    description: {
      tr: "Küçük ama düzenli bir kompozisyon düşün. Simetri ve temiz ölçü burada daha belirleyicidir.",
      en: "Think of a small but structured composition where symmetry and clean spacing matter more.",
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
    coverUp: false,
    imageSlot: CALIBRATION_IMAGE_SLOTS.colorPiece,
    imagePresentation: IMAGE_PRESENTATIONS.colorPiece,
    title: { tr: "10–12 cm renkli parça", en: "10–12 cm color piece" },
    metaLine: {
      tr: "Üst kol · renkli · tek ana parça",
      en: "Upper arm · color · single main subject",
    },
    description: {
      tr: "Renkli, tek ana parçalı bir iş düşün. Burada renk farkı baskın olsun; realism ya da cover-up sinyali vermesin.",
      en: "Think of a color piece with one main subject. The color premium should be the main signal here.",
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
    coverUp: true,
    imageSlot: CALIBRATION_IMAGE_SLOTS.coverUp,
    imagePresentation: IMAGE_PRESENTATIONS.coverUp,
    title: { tr: "Küçük cover-up", en: "Small cover-up" },
    metaLine: {
      tr: "Ön kol · siyah ağırlıklı · küçük dövme kapatma",
      en: "Forearm · mostly black · covering a small existing tattoo",
    },
    description: {
      tr: "Küçük bir kapatma işi düşün. Yoğun siyah doluluk, sıradan bir floral parçadan daha belirgin olsun.",
      en: "Think of a small cover-up with enough dark fill to clearly read as concealment work.",
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
    coverUp: false,
    imageSlot: FINAL_CONTROL_IMAGE_SLOTS.textWord,
    imagePresentation: IMAGE_PRESENTATIONS.text,
    title: { tr: "Kısa yazı", en: "Short text" },
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
    coverUp: false,
    imageSlot: FINAL_CONTROL_IMAGE_SLOTS.smallSymbol,
    imagePresentation: IMAGE_PRESENTATIONS.symbol,
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
    placementDetail: "forearm-outer",
    colorMode: "black-only",
    workStyle: "clean_line",
    coverUp: false,
    imageSlot: FINAL_CONTROL_IMAGE_SLOTS.singleObject,
    imagePresentation: IMAGE_PRESENTATIONS.singleObject,
    title: { tr: "Tek obje", en: "Single object" },
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
    workStyle: "clean_line",
    coverUp: false,
    imageSlot: FINAL_CONTROL_IMAGE_SLOTS.multiElement,
    imagePresentation: IMAGE_PRESENTATIONS.multiElement,
    title: { tr: "Çok öğeli tasarım", en: "Multi-element design" },
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
    coverUp: true,
    imageSlot: FINAL_CONTROL_IMAGE_SLOTS.coverUp,
    imagePresentation: IMAGE_PRESENTATIONS.coverUp,
    title: { tr: "Küçük cover-up", en: "Small cover-up" },
    metaLine: {
      tr: "Ön kol · siyah ağırlıklı · kapatma",
      en: "Forearm · mostly black · covering a small tattoo",
    },
  },
  {
    id: "review-color",
    requestType: "single_object",
    referenceSizeCm: 12,
    placementBucket: "easy",
    placementDetail: "upper-arm-outer",
    colorMode: "full-color",
    workStyle: "clean_line",
    coverUp: false,
    imageSlot: FINAL_CONTROL_IMAGE_SLOTS.colorPiece,
    imagePresentation: IMAGE_PRESENTATIONS.colorPiece,
    title: { tr: "Renkli parça", en: "Color piece" },
    metaLine: {
      tr: "Üst kol · renkli · tek ana parça",
      en: "Upper arm · color · single main subject",
    },
  },
] as const;

export const PRICING_V2_LARGE_AREA_CASES: PricingLargeAreaCase[] = [
  {
    id: "forearm-large-coverage",
    imageSlot: "",
    title: { tr: "Ön kolun büyük kısmını kaplayan iş", en: "Piece covering most of the forearm" },
    metaLine: {
      tr: "Siyah-gri · daha dolu, gölgeli",
      en: "Black-grey · fuller / shaded",
    },
  },
  {
    id: "calf-large-coverage",
    imageSlot: "",
    title: { tr: "Baldırın büyük kısmını kaplayan iş", en: "Piece covering most of the calf" },
    metaLine: {
      tr: "Sadece siyah · daha düzenli, simetrik",
      en: "Black only · more structured / symmetrical",
    },
  },
  {
    id: "chest-large-coverage",
    imageSlot: "",
    title: { tr: "Göğüste geniş alan kaplayan iş", en: "Wide coverage piece on the chest" },
    metaLine: {
      tr: "Siyah-gri · daha dolu, gölgeli",
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
      tr: "Siyah-gri · daha dolu, gölgeli",
      en: "Black-grey · fuller / shaded",
    },
  },
  {
    id: "full-sleeve",
    imageSlot: "",
    title: { tr: "Tüm kolu kaplayan iş", en: "Piece covering the full arm" },
    metaLine: {
      tr: "Siyah-gri · daha dolu, gölgeli",
      en: "Black-grey · fuller / shaded",
    },
  },
  {
    id: "back-large-coverage",
    imageSlot: "",
    title: { tr: "Sırtta geniş alan kaplayan iş", en: "Large coverage piece on the back" },
    metaLine: {
      tr: "Siyah-gri · daha dolu, gölgeli",
      en: "Black-grey · fuller / shaded",
    },
  },
] as const;
