import type { BodyAreaDetailValue } from "@/lib/constants/body-placement";
import type { PublicLocale } from "@/lib/i18n/public";
import type {
  AreaScopeValue,
  ArtistFeaturedDesign,
  ArtistPricingRules,
  ArtistPricingV2Profile,
  ColorModeValue,
  EstimateMode,
  LargeAreaCoverageValue,
  PricingSourceValue,
  RequestTypeValue,
  SubmissionRequest,
  WideAreaTargetValue,
  WorkStyleValue,
} from "@/lib/types";

export type PlacementBucket = "easy" | "standard" | "hard";

export type PricingV2Output = {
  mode: EstimateMode;
  min: number;
  max: number | null;
  displayLabel: string;
  summaryText: string;
  internalConfidence?: number;
  internalReasoning?: string[];
};

export type CustomRequestPricingInput = {
  areaScope: AreaScopeValue;
  requestType: RequestTypeValue | null;
  placement: BodyAreaDetailValue;
  largeAreaCoverage?: LargeAreaCoverageValue | null;
  wideAreaTarget?: WideAreaTargetValue | null;
  sizeCm: number;
  colorMode: ColorModeValue;
  workStyle: WorkStyleValue;
  hasReferenceImage: boolean;
  hasReferenceNote: boolean;
  coverUp?: boolean | null;
};

export type FeaturedDesignPricingInput = {
  placement: BodyAreaDetailValue;
  sizeCm: number;
  colorMode: ColorModeValue;
};

export type PricingV2Context = {
  locale: PublicLocale;
  currency: string;
  pricingRules: ArtistPricingRules;
  profile: ArtistPricingV2Profile;
};

export type SubmissionPricingV2Context = {
  locale: PublicLocale;
  currency: string;
  pricingRules: ArtistPricingRules;
  featuredDesigns?: ArtistFeaturedDesign[];
};

export type SubmissionPricingV2Result = PricingV2Output & {
  pricingSource: PricingSourceValue;
  requestType: RequestTypeValue | null;
  featuredDesignPricingMode: ArtistFeaturedDesign["pricingMode"] | null;
  submission: SubmissionRequest;
};
