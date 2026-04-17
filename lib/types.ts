import type {
  BodyAreaDetailValue,
  BodyAreaGroupValue,
} from "@/lib/constants/body-placement";
import type {
  FeaturedCategoryValue,
  IntentValue,
  SizeValue,
} from "@/lib/constants/options";
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
  active: boolean;
  sortOrder: number;
};

export type DetailLevelValue = "simple" | "standard" | "detailed";
export type ColorModeValue = "black-only" | "black-grey" | "full-color";
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
};
export type FinalControlProbeType =
  | "low_boundary"
  | "color"
  | "baseline"
  | "high_detail"
  | "style";
export type FinalControlPlacementType = "easy_flat";
export type PricingValidationFeedback = "looks-right" | "slightly-low" | "slightly-high";
export type PricingValidationExampleId =
  | "text-low-boundary"
  | "current-dagger"
  | "feather-high-detail"
  | "realistic-eye"
  | "colored-butterfly";
export type PricingValidationStatus =
  | "pending"
  | "confirmed"
  | "adjusted"
  | "completed-no-majority"
  | "needs-review";
export type PricingFinalValidation = {
  validationRound: 1 | 2;
  perExampleFeedback: Partial<Record<PricingValidationExampleId, PricingValidationFeedback>>;
  appliedGlobalValidationAdjustment: number;
  validationStatus: PricingValidationStatus;
  calibratedAndValidated: boolean;
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
  intent: IntentValue | "";
  selectedDesignId: string | "";
  referenceImage: string;
  referenceImagePath: string;
  referenceDescription: string;
  city: string;
  preferredStartDate: string;
  preferredEndDate: string;
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
  style: string;
  notes: string;
};

export type EstimateResult = {
  estimatedMin: number;
  estimatedMax: number;
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
  intent: IntentValue;
  selectedDesignId?: string | null;
  referenceImage?: string | null;
  referenceImagePath?: string | null;
  referenceDescription?: string | null;
  city?: string | null;
  preferredStartDate?: string | null;
  preferredEndDate?: string | null;
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
  style: string;
  notes?: string;
};
