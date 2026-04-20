import type {
  BodyAreaDetailValue,
  BodyAreaGroupValue,
} from "@/lib/constants/body-placement";
import type {
  AreaScopeValue,
  FeaturedCategoryValue,
  IntentValue,
  LayoutStyleValue,
  LargeAreaCoverageValue,
  RealismLevelValue,
  SizeValue,
  WideAreaTargetValue,
  WorkStyleValue,
} from "@/lib/constants/options";
export type { RequestTypeValue } from "@/lib/constants/options";
export type { WorkStyleValue } from "@/lib/constants/options";
export type { RealismLevelValue } from "@/lib/constants/options";
export type { LayoutStyleValue } from "@/lib/constants/options";
export type { AreaScopeValue, LargeAreaCoverageValue, WideAreaTargetValue } from "@/lib/constants/options";
import type { RequestTypeValue } from "@/lib/constants/options";
import type { SizeMode } from "@/lib/constants/size-estimation";
import type { PublicLocale } from "@/lib/i18n/public";
import type {
  BackgroundType,
  BodyFontKey,
  FontPairingPreset,
  HeadingFontKey,
  RadiusStyle,
  ThemeMode,
  ThemePresetKey,
} from "@/lib/constants/theme";

export type PriceRange = {
  min: number;
  max: number;
};

export type PricingSourceValue = "custom_request" | "featured_design";
export type EstimateMode = "range" | "soft_range" | "starting_from";
export type LeadPreferenceValue = "lead_friendly" | "balanced" | "filtered";
export type ColorImpactPreferenceValue = "low" | "medium" | "high";
export type CoverUpImpactPreferenceValue = "low" | "medium" | "high";
export type WorkStyleSensitivityValue = "low" | "medium" | "high";
export type FeaturedDesignPricingMode =
  | "fixed_range"
  | "size_adjusted"
  | "size_and_placement_adjusted"
  | "starting_from";

export type TimeRange = {
  minHours: number;
  maxHours: number;
};

export type ArtistProfile = {
  id: string;
  userId: string | null;
  artistName: string;
  slug: string;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
  shortBio: string;
  welcomeHeadline: string;
  whatsappNumber: string;
  instagramHandle: string;
  currency: "TRY" | "EUR" | "USD";
  active: boolean;
  planType: "free" | "pro";
  accessStatus: "active" | "pending" | "blocked";
};

export type ArtistFunnelSettings = {
  artistId: string;
  introEyebrow: string;
  introTitle: string;
  introDescription: string;
  showFeaturedDesigns: boolean;
  defaultLanguage: PublicLocale;
  bookingCities: ArtistBookingCity[];
};

export type ArtistBookingCity = {
  id: string;
  cityName: string;
  availableDates: string[];
};

export type ArtistStyleOption = {
  id: string;
  artistId: string;
  styleKey: string;
  label: string;
  description?: string | null;
  imageUrl?: string | null;
  imagePath?: string | null;
  enabled: boolean;
  multiplier: number;
  isCustom?: boolean;
  deleted?: boolean;
};

export type ArtistFeaturedDesign = {
  id: string;
  artistId: string;
  category: FeaturedCategoryValue;
  title: string;
  shortDescription: string;
  imageUrl: string | null;
  imagePath: string | null;
  priceNote: string | null;
  referenceDetailLevel?: DetailLevelValue | null;
  referencePriceMin: number | null;
  referencePriceMax: number | null;
  referenceSizeCm?: number | null;
  referenceColorMode?: ColorModeValue | null;
  pricingMode?: FeaturedDesignPricingMode | null;
  colorImpactPreference?: ColorImpactPreferenceValue | null;
  active: boolean;
  sortOrder: number;
};

export type DetailLevelValue = "simple" | "standard" | "detailed";
export type ColorModeValue = "black-only" | "black-grey" | "full-color";
export type CustomerGenderValue = "female" | "male" | "prefer_not_to_say";
export type CustomerAgeRangeValue = "18-24" | "25-34" | "35-44" | "45+";
export type DetailCalibrationLevel = "low" | "medium" | "high";
export type DetailCalibrationFamily = "floral" | "geometric" | "snake";
export type DetailCalibrationRawResponse = {
  sampleId: string;
  family: DetailCalibrationFamily;
  canonicalDetailLevel: DetailCalibrationLevel;
  selectedDetailLevel: DetailCalibrationLevel;
  delta: number;
};
export type DetailCalibrationProfile = {
  version: 1;
  sampleSetVersion: string;
  sampleOrder: string[];
  rawResponses: DetailCalibrationRawResponse[];
  detailBiasScore: number;
  familyBiasScores: Record<DetailCalibrationFamily, number>;
  normalizedDetailMapping: Record<DetailCalibrationLevel, number>;
  calibrationCompletedAt: string;
  completed: boolean;
};
export type PricingCalibrationRawInputs = {
  minimumPrice: number;
  roseMedium8cm: number;
  roseMedium18cm: number;
  roseMedium25cm: number;
  roseLow18cm: number;
  roseHigh18cm: number;
  roseColor18cm: number;
  daggerAnchor18cm: number;
  textAnchorPrice?: number | null;
  minimalSymbolAnchorPrice?: number | null;
};
export type PricingSimpleBaseline = {
  textAnchorPrice: number;
  minimalSymbolAnchorPrice: number;
  blendedPrice: number;
};
export type PricingV2CaseAnswer = {
  id: string;
  min: number;
  max: number;
};
export type PricingV2WideAreaAnswer = {
  id: string;
  startingFrom: number;
};
export type PricingV2ReviewAnswer = {
  id: string;
  verdict: PricingValidationFeedback;
  reason?: PricingV2ReviewReason;
  adjustmentBias?: number;
  iterationCount?: number;
};
export type PricingV2ReviewReason =
  | "size"
  | "detail"
  | "placement"
  | "color_shading"
  | "cover_up"
  | "general";
export type PricingV2SizeSeries = {
  object6cm: number;
  object10cm: number;
  object16cm: number;
};
export type PricingV2SizeProfile = {
  anchorSizeCm: number;
  anchorPrice: number;
  series: PricingV2SizeSeries;
  normalizedRatios: {
    object6To10: number;
    object10To16: number;
    object6To16: number;
  };
  growth: {
    lowerSlope: number;
    upperSlope: number;
    overallSlope: number;
  };
  inferredExponentOffset: number;
  minimumTension: number;
  artistBlendWeight: number;
};
export type PricingV2ReviewAdjustments = {
  globalBias: number;
  textBias: number;
  miniSimpleBias: number;
  singleObjectBias: number;
  largeSizeBias: number;
  multiElementBias: number;
  coverUpBias: number;
  placementBias: number;
  detailBias: number;
  colorShadingBias: number;
};
export type PricingV2CategoryAnchors = {
  text: number;
  miniSimple: number;
  singleObject: number;
  multiElement: number;
  coverUp: number;
  unsure: number;
};
export type PricingV2SpecialCaseAdjustments = {
  blackGreyFactor: number;
  fullColorFactor: number;
  shadedDetailedFactor: number;
  advancedRealismFactor: number;
  precisionSymmetricFactor: number;
  coverUpPremiumFactor: number;
};
export type PricingV2WorkStyleSensitivity = {
  cleanLine: WorkStyleSensitivityValue;
  shadedDetailed: WorkStyleSensitivityValue;
  precisionSymmetric: WorkStyleSensitivityValue;
};
export type ArtistPricingV2Profile = {
  version: 2;
  leadPreference: LeadPreferenceValue;
  minimumJobPrice: number;
  textStartingPrice: number;
  colorImpactPreference: ColorImpactPreferenceValue;
  coverUpImpactPreference: CoverUpImpactPreferenceValue;
  onboardingCases: PricingV2CaseAnswer[];
  onboardingLargeAreasEnabled: boolean;
  largeAreaCases: PricingV2CaseAnswer[];
  wideAreaCases: PricingV2WideAreaAnswer[];
  reviewCases: PricingV2ReviewAnswer[];
  sizeSeries: PricingV2SizeSeries;
  inferredSizeProfile: PricingV2SizeProfile;
  reviewAdjustments: PricingV2ReviewAdjustments;
  categoryAnchors: PricingV2CategoryAnchors;
  specialCaseAdjustments: PricingV2SpecialCaseAdjustments;
  workStyleSensitivity: PricingV2WorkStyleSensitivity;
  onboardingCompleted: boolean;
};
export type PricingProfile = {
  version: 1;
  basePrice: number;
  size: {
    small: number;
    medium: 1;
    large: number;
  };
  detail: {
    low: number;
    medium: 1;
    high: number;
  };
  color: {
    factor: number;
  };
  anchor: {
    ratio: number;
  };
  simpleBaseline?: PricingSimpleBaseline | null;
  adjustments: PricingProfileAdjustments;
  finalControl: PricingFinalControlState | null;
};
export type FinalControlProbeType =
  | "low_boundary"
  | "color"
  | "baseline"
  | "high_detail"
  | "style";
export type FinalControlPlacementType = "easy_flat";
export type PricingValidationReason = "size" | "detail" | "color" | "general";
export type PricingValidationFeedback = "looks-right" | "slightly-low" | "slightly-high";
export type PricingValidationExampleId =
  | "text-low-boundary"
  | "current-dagger"
  | "feather-high-detail"
  | "realistic-eye"
  | "colored-butterfly";
export type PricingProfileAdjustmentKey =
  | "baseline"
  | "sizeSmall"
  | "detailLow"
  | "detailHigh"
  | "color"
  | "style";
export type PricingProfileAdjustments = Record<PricingProfileAdjustmentKey, number>;
export type PricingProfileUpdateChange = {
  key: PricingProfileAdjustmentKey;
  delta: number;
  before: number;
  after: number;
};
export type PricingProfileUpdateLog = {
  probeId: PricingValidationExampleId;
  probeType: FinalControlProbeType;
  verdict: PricingValidationFeedback;
  reason: PricingValidationReason | null;
  changes: PricingProfileUpdateChange[];
};
export type PricingFinalControlState = {
  version: 1;
  responses: Partial<
    Record<
      PricingValidationExampleId,
      {
        verdict: PricingValidationFeedback;
        reason: PricingValidationReason | null;
      }
    >
  >;
  appliedUpdates: PricingProfileUpdateLog[];
  updatedAt: string;
};
export type PricingValidationStatus =
  | "pending"
  | "confirmed"
  | "adjusted"
  | "completed-no-majority"
  | "needs-review";
export type PricingFinalValidation = {
  validationRound: number;
  perExampleFeedback: Partial<Record<PricingValidationExampleId, PricingValidationFeedback>>;
  perExampleReason?: Partial<Record<PricingValidationExampleId, PricingValidationReason>>;
  appliedGlobalValidationAdjustment: number;
  validationStatus: PricingValidationStatus;
  calibratedAndValidated: boolean;
  appliedUpdates?: PricingProfileUpdateLog[];
};

export type PricingCalibrationExamples = {
  size: Record<SizeValue, number>;
  sizeCurve?: Record<"8" | "12" | "18" | "25", number>;
  rawAnswers?: {
    sizeCurve: Record<"8" | "12" | "18" | "25", PriceRange>;
    detailLevel: {
      low: PriceRange;
      medium: PriceRange;
      high: PriceRange;
      ultra?: PriceRange;
    };
    placementDifficulty: {
      easy: PriceRange;
      medium?: PriceRange;
      hard: PriceRange;
    };
    colorMode: {
      black: PriceRange;
      color: PriceRange;
    };
  };
  detailLevel: Record<DetailLevelValue, number> & {
    ultra?: number;
  };
  placement: Record<string, number>;
  placementDifficulty?: {
    easy: number;
    medium?: number;
    hard: number;
  };
  colorMode: Record<ColorModeValue, number>;
  globalScale?: number;
  finalValidation?: PricingFinalValidation;
  detailCalibration?: DetailCalibrationProfile | null;
  pricingRawInputs?: PricingCalibrationRawInputs | null;
  pricingProfile?: PricingProfile | null;
  pricingV2Profile?: ArtistPricingV2Profile | null;
};

export type PricingCalibrationReferenceSlot = {
  slotId: string;
  axis: "size" | "detailLevel" | "placement" | "colorMode";
  key: string;
  label: string;
  assetRef: string | null;
};

export type ArtistPricingRules = {
  artistId: string;
  pricingVersion?: string | null;
  anchorPrice: number;
  basePrice: number;
  minimumCharge: number;
  calibrationExamples: PricingCalibrationExamples;
  calibrationReferenceSlots: PricingCalibrationReferenceSlot[];
  sizeModifiers: Record<SizeValue, PriceRange>;
  placementModifiers: Record<string, PriceRange>;
  detailLevelModifiers: Record<DetailLevelValue, PriceRange>;
  colorModeModifiers: Record<ColorModeValue, PriceRange>;
  addonFees: {
    coverUp: PriceRange;
    customDesign: PriceRange;
  };
  minimumSessionPrice: number;
  sizeBaseRanges: Record<SizeValue, PriceRange>;
  sizeTimeRanges: Record<SizeValue, TimeRange>;
  placementMultipliers: Record<string, number>;
  intentMultipliers: Record<IntentValue, number>;
};

export type ArtistPageTheme = {
  artistId: string;
  presetTheme: ThemePresetKey;
  backgroundType: BackgroundType;
  backgroundColor: string;
  gradientStart: string;
  gradientEnd: string;
  backgroundImageUrl: string | null;
  textColor: string;
  primaryColor: string;
  secondaryColor: string;
  cardColor: string;
  cardOpacity: number;
  headingFont: HeadingFontKey;
  bodyFont: BodyFontKey;
  fontPairingPreset: FontPairingPreset;
  radiusStyle: RadiusStyle;
  themeMode: ThemeMode;
  customWelcomeTitle: string | null;
  customIntroText: string | null;
  customCtaLabel: string | null;
  featuredSectionLabel1: string | null;
  featuredSectionLabel2: string | null;
};

export type ArtistSavedTheme = {
  id: string;
  artistId: string;
  name: string;
  theme: ArtistPageTheme;
  createdAt: string;
};

export type ClientSubmission = {
  id: string;
  artistId: string;
  status: LeadStatus;
  pricingVersion: string | null;
  pricingSource: PricingSourceValue | null;
  areaScope: AreaScopeValue | null;
  largeAreaCoverage: LargeAreaCoverageValue | null;
  wideAreaTarget: WideAreaTargetValue | null;
  requestType: RequestTypeValue | null;
  estimateMode: EstimateMode | null;
  featuredDesignPricingMode: FeaturedDesignPricingMode | null;
  displayEstimateLabel: string | null;
  intent: IntentValue;
  selectedDesignId: string | null;
  bodyAreaGroup: BodyAreaGroupValue;
  bodyAreaDetail: BodyAreaDetailValue;
  sizeMode: SizeMode | null;
  approximateSizeCm: number | null;
  sizeCategory: SizeValue;
  widthCm: number | null;
  heightCm: number | null;
  referenceImageUrl: string | null;
  referenceImagePath: string | null;
  referenceDescription: string | null;
  city: string | null;
  preferredStartDate: string | null;
  preferredEndDate: string | null;
  gender: CustomerGenderValue | null;
  ageRange: CustomerAgeRangeValue | null;
  workStyle: WorkStyleValue | null;
  coverUp: boolean | null;
  style: string;
  notes: string | null;
  estimatedMin: number;
  estimatedMax: number;
  contactMessage: string;
  contacted: boolean;
  convertedToSale: boolean;
  soldAt: string | null;
  createdAt: string;
};

export type LeadStatus = "new" | "contacted" | "sold" | "lost";

export type SubmissionDraft = {
  pricingSource: PricingSourceValue | "";
  areaScope: AreaScopeValue | "";
  selectedDesignCategory: string | "";
  largeAreaCoverage: LargeAreaCoverageValue | "";
  wideAreaTarget: WideAreaTargetValue | "";
  requestType: RequestTypeValue | "";
  intent: IntentValue | "";
  selectedDesignId: string | "";
  referenceImage: string;
  referenceImagePath: string;
  referenceDescription: string;
  city: string;
  preferredStartDate: string;
  preferredEndDate: string;
  gender: CustomerGenderValue | "";
  ageRange: CustomerAgeRangeValue | "";
  workStyle: WorkStyleValue | "";
  realismLevel: RealismLevelValue | "";
  layoutStyle: LayoutStyleValue | "";
  bodyAreaGroup: BodyAreaGroupValue | "";
  bodyAreaDetail: BodyAreaDetailValue | "";
  sizeMode: SizeMode;
  approximateSizeCm: number | null;
  sizeCategory: SizeValue | "";
  widthCm: number | null;
  heightCm: number | null;
  detailLevel: DetailLevelValue | "";
  colorMode: ColorModeValue | "";
  coverUp: boolean | null;
  notes: string;
};

export type EstimateResult = {
  estimatedMin: number;
  estimatedMax: number;
  estimateMode: EstimateMode;
  displayLabel: string;
  summary: string;
  disclaimer: string;
  whatsappLink: string;
  message: string;
};

export type ArtistPageData = {
  profile: ArtistProfile;
  funnelSettings: ArtistFunnelSettings;
  styleOptions: ArtistStyleOption[];
  featuredDesigns: ArtistFeaturedDesign[];
  pricingRules: ArtistPricingRules;
  pageTheme: ArtistPageTheme;
  savedThemes: ArtistSavedTheme[];
};

export type DashboardData = ArtistPageData & {
  leads: ClientSubmission[];
  demoMode: boolean;
};

export type SupportMessage = {
  id: string;
  artistId: string;
  artistName: string;
  accountEmail: string;
  message: string;
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
};

export type ArtistNotification = {
  id: string;
  artistId: string;
  title: string;
  body: string;
  senderLabel: string;
  readAt: string | null;
  createdAt: string;
};

export type SubmissionRequest = {
  artistSlug: string;
  locale?: PublicLocale;
  pricingSource?: PricingSourceValue | null;
  areaScope?: AreaScopeValue | null;
  largeAreaCoverage?: LargeAreaCoverageValue | null;
  wideAreaTarget?: WideAreaTargetValue | null;
  requestType?: RequestTypeValue | null;
  intent: IntentValue;
  selectedDesignId?: string | null;
  referenceImage?: string | null;
  referenceImagePath?: string | null;
  referenceDescription?: string | null;
  city?: string | null;
  preferredStartDate?: string | null;
  preferredEndDate?: string | null;
  gender?: CustomerGenderValue | null;
  ageRange?: CustomerAgeRangeValue | null;
  workStyle?: WorkStyleValue | null;
  realismLevel?: RealismLevelValue | null;
  layoutStyle?: LayoutStyleValue | null;
  bodyAreaGroup: BodyAreaGroupValue;
  bodyAreaDetail: BodyAreaDetailValue;
  sizeMode: SizeMode;
  approximateSizeCm?: number | null;
  sizeCategory: SizeValue;
  widthCm?: number | null;
  heightCm?: number | null;
  detailLevel?: DetailLevelValue | null;
  colorMode?: ColorModeValue | null;
  coverUp?: boolean | null;
  customDesign?: boolean | null;
  designType?: string | null;
  style?: string;
  notes?: string;
};
