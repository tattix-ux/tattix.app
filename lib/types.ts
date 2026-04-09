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
};

export type ArtistFunnelSettings = {
  artistId: string;
  introEyebrow: string;
  introTitle: string;
  introDescription: string;
  showFeaturedDesigns: boolean;
  defaultLanguage: PublicLocale;
};

export type ArtistStyleOption = {
  id: string;
  artistId: string;
  styleKey: string;
  label: string;
  enabled: boolean;
  multiplier: number;
  isCustom?: boolean;
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
  referencePriceMin: number | null;
  referencePriceMax: number | null;
  active: boolean;
  sortOrder: number;
};

export type ArtistPricingRules = {
  artistId: string;
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

export type ClientSubmission = {
  id: string;
  artistId: string;
  intent: IntentValue;
  bodyAreaGroup: BodyAreaGroupValue;
  bodyAreaDetail: BodyAreaDetailValue;
  sizeMode: SizeMode | null;
  approximateSizeCm: number | null;
  sizeCategory: SizeValue;
  widthCm: number | null;
  heightCm: number | null;
  style: string;
  notes: string | null;
  estimatedMin: number;
  estimatedMax: number;
  contactMessage: string;
  contacted: boolean;
  createdAt: string;
};

export type SubmissionDraft = {
  intent: IntentValue | "";
  selectedDesignId: string | "";
  referenceImage: string;
  referenceDescription: string;
  bodyAreaGroup: BodyAreaGroupValue | "";
  bodyAreaDetail: BodyAreaDetailValue | "";
  sizeMode: SizeMode;
  approximateSizeCm: number | null;
  sizeCategory: SizeValue | "";
  widthCm: number | null;
  heightCm: number | null;
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
};

export type DashboardData = ArtistPageData & {
  leads: ClientSubmission[];
  demoMode: boolean;
};

export type SubmissionRequest = {
  artistSlug: string;
  locale?: PublicLocale;
  intent: IntentValue;
  selectedDesignId?: string | null;
  referenceImage?: string | null;
  referenceDescription?: string | null;
  bodyAreaGroup: BodyAreaGroupValue;
  bodyAreaDetail: BodyAreaDetailValue;
  sizeMode: SizeMode;
  approximateSizeCm?: number | null;
  sizeCategory: SizeValue;
  widthCm?: number | null;
  heightCm?: number | null;
  style: string;
  notes?: string;
};
