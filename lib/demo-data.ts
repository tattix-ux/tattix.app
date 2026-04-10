import { bodyPlacementGroups } from "@/lib/constants/body-placement";
import { styleOptions as baseStyleOptions } from "@/lib/constants/options";
import { buildDefaultArtistTheme } from "@/lib/theme";
import type {
  ArtistFeaturedDesign,
  ArtistFunnelSettings,
  ArtistPageData,
  ArtistPageTheme,
  ArtistPricingRules,
  ArtistProfile,
  ArtistStyleOption,
  ClientSubmission,
} from "@/lib/types";

const demoArtistId = "7d53df9f-4fd8-41af-ae82-187a0b81b420";

export const demoArtistProfile: ArtistProfile = {
  id: demoArtistId,
  userId: null,
  artistName: "Ink Atelier Demo",
  slug: "ink-atelier-demo",
  profileImageUrl: null,
  coverImageUrl: null,
  shortBio:
    "Boutique tattoo studio focused on elegant blackwork, fine line storytelling, and ornamental pieces.",
  welcomeHeadline: "Start your tattoo brief in under two minutes.",
  whatsappNumber: "+905550001122",
  instagramHandle: "@inkatelier.demo",
  currency: "TRY",
  active: true,
  planType: "pro",
  accessStatus: "active",
};

export const demoFunnelSettings: ArtistFunnelSettings = {
  artistId: demoArtistId,
  introEyebrow: "Link-in-bio funnel",
  introTitle: "Tell us the vibe, size, and placement. Tattix will estimate the range.",
  introDescription:
    "Perfect for Instagram bio traffic. Collect warmer leads, surface flash designs, and move straight into WhatsApp with context.",
  showFeaturedDesigns: true,
  defaultLanguage: "tr",
};

export const demoStyleOptions: ArtistStyleOption[] = baseStyleOptions.map((style, index) => {
  const enabledStyles = new Set(["fine-line", "blackwork", "micro-realism"]);
  const multipliers: Record<string, number> = {
    "fine-line": 1,
    blackwork: 1.12,
    "micro-realism": 1.18,
  };

  return {
    id: `style-${index + 1}`,
    artistId: demoArtistId,
    styleKey: style.value,
    label: style.label,
    enabled: enabledStyles.has(style.value),
    isCustom: false,
    multiplier: multipliers[style.value] ?? 1.1,
  };
});

demoStyleOptions.push({
  id: "style-custom-etching",
  artistId: demoArtistId,
  styleKey: "etching",
  label: "Etching",
  enabled: true,
  isCustom: true,
  multiplier: 1.08,
});

export const demoPricingRules: ArtistPricingRules = {
  artistId: demoArtistId,
  minimumSessionPrice: 1500,
  sizeBaseRanges: {
    tiny: { min: 1000, max: 1800 },
    small: { min: 1500, max: 2500 },
    medium: { min: 3000, max: 5000 },
    large: { min: 6000, max: 9000 },
  },
  sizeTimeRanges: {
    tiny: { minHours: 0.5, maxHours: 1 },
    small: { minHours: 1, maxHours: 2 },
    medium: { minHours: 2, maxHours: 4 },
    large: { minHours: 4, maxHours: 6 },
  },
  placementMultipliers: {
    "neck-front": 1.3,
    "neck-side": 1.3,
    "neck-back": 1.25,
    ribs: 1.25,
    fingers: 1.15,
    "forearm-outer": 1,
    "forearm-inner": 1.05,
    wrist: 1.05,
    sternum: 1.2,
    ankle: 1.1,
  },
  intentMultipliers: {
    "custom-tattoo": 1,
    "design-in-mind": 1,
    "flash-design": 0.95,
    "discounted-design": 0.85,
    "not-sure": 1,
  },
};

export const demoArtistTheme: ArtistPageTheme = {
  ...buildDefaultArtistTheme(),
  artistId: demoArtistId,
  presetTheme: "luxury-serif",
  backgroundType: "gradient",
  backgroundColor: "#120d11",
  gradientStart: "#241521",
  gradientEnd: "#0b090c",
  primaryColor: "#d7b48a",
  secondaryColor: "#32262e",
  cardColor: "#171116",
  cardOpacity: 0.82,
  headingFont: "editorial-serif",
  bodyFont: "clean-sans",
  fontPairingPreset: "elegant-editorial",
  radiusStyle: "large",
  themeMode: "dark",
  customWelcomeTitle: "Ink Atelier Demo",
  customIntroText:
    "Share the placement, size, and style. We’ll return a polished estimate range before you message the studio.",
  customCtaLabel: "Start estimate",
  featuredSectionLabel1: "Featured collections",
  featuredSectionLabel2: "Artist-picked concepts worth claiming",
};

export const demoFeaturedDesigns: ArtistFeaturedDesign[] = [
  {
    id: "design-1",
    artistId: demoArtistId,
    category: "flash-designs",
    title: "Serpent Bloom",
    shortDescription: "Delicate floral coil built for forearm or calf placement.",
    imageUrl: null,
    imagePath: null,
    priceNote: "From 2800 TRY",
    referencePriceMin: 2800,
    referencePriceMax: 4200,
    active: true,
    sortOrder: 1,
  },
  {
    id: "design-2",
    artistId: demoArtistId,
    category: "flash-designs",
    title: "Lunar Dagger",
    shortDescription: "A dramatic blackwork concept ideal for thigh or ribs.",
    imageUrl: null,
    imagePath: null,
    priceNote: "From 3500 TRY",
    referencePriceMin: 3500,
    referencePriceMax: 5200,
    active: true,
    sortOrder: 2,
  },
  {
    id: "design-3",
    artistId: demoArtistId,
    category: "discounted-designs",
    title: "Mini Ornamental Charm",
    shortDescription: "Quick ornamental accent intended for wrist, ankle, or hand.",
    imageUrl: null,
    imagePath: null,
    priceNote: "Quick slot",
    referencePriceMin: 1200,
    referencePriceMax: 1800,
    active: true,
    sortOrder: 3,
  },
];

export const demoLeads: ClientSubmission[] = [
  {
    id: "submission-1",
    artistId: demoArtistId,
    intent: "custom-tattoo",
    selectedDesignId: null,
    bodyAreaGroup: "arm",
    bodyAreaDetail: "forearm-outer",
    sizeMode: "quick",
    approximateSizeCm: 9,
    sizeCategory: "medium",
    widthCm: 9,
    heightCm: null,
    referenceImageUrl: null,
    referenceImagePath: null,
    referenceDescription: null,
    city: "İzmir",
    preferredStartDate: null,
    preferredEndDate: null,
    style: "fine-line",
    notes: "Botanical flow with soft leaves and a hidden crescent moon.",
    estimatedMin: 3000,
    estimatedMax: 4500,
    contactMessage:
      "Hi! I want to discuss a tattoo.\n\nIntent: Custom tattoo\nPlacement: Forearm outer\nSize: Medium\nApproximate size: 9 cm\nCity: İzmir\nStyle: Fine line\nNotes: Botanical flow with soft leaves and a hidden crescent moon.\nEstimated price shown: 3000 - 4500 TRY",
    contacted: false,
    convertedToSale: true,
    soldAt: "2026-04-09T11:00:00.000Z",
    createdAt: "2026-04-08T18:30:00.000Z",
  },
  {
    id: "submission-2",
    artistId: demoArtistId,
    intent: "discounted-design",
    selectedDesignId: "design-3",
    bodyAreaGroup: "leg",
    bodyAreaDetail: "ankle",
    sizeMode: "quick",
    approximateSizeCm: 6,
    sizeCategory: "small",
    widthCm: 6,
    heightCm: null,
    referenceImageUrl: null,
    referenceImagePath: null,
    referenceDescription: null,
    city: "İstanbul",
    preferredStartDate: null,
    preferredEndDate: null,
    style: "ornamental",
    notes: "Looking for a small mirrored ankle motif.",
    estimatedMin: 1600,
    estimatedMax: 2450,
    contactMessage:
      "Hi! I want to discuss a tattoo.\n\nIntent: Discounted designs\nPlacement: Ankle\nSize: Small\nApproximate size: 6 cm\nCity: İstanbul\nStyle: Ornamental\nNotes: Looking for a small mirrored ankle motif.\nEstimated price shown: 1600 - 2450 TRY",
    contacted: true,
    convertedToSale: false,
    soldAt: null,
    createdAt: "2026-04-07T12:10:00.000Z",
  },
];

export const demoArtistPageData: ArtistPageData = {
  profile: demoArtistProfile,
  funnelSettings: demoFunnelSettings,
  styleOptions: demoStyleOptions,
  featuredDesigns: demoFeaturedDesigns,
  pricingRules: demoPricingRules,
  pageTheme: demoArtistTheme,
};

export const defaultPlacement = {
  group: bodyPlacementGroups[1].value,
  detail: bodyPlacementGroups[1].details[1].value,
};
