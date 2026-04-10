import { z } from "zod";

import { bodyPlacementGroups } from "@/lib/constants/body-placement";
import {
  currencyOptions,
  featuredDesignCategories,
  intentOptions,
  sizeOptions,
} from "@/lib/constants/options";
import {
  backgroundTypeOptions,
  bodyFontOptions,
  fontPairingPresetOptions,
  headingFontOptions,
  radiusStyleOptions,
  themeModeOptions,
  themePresetOptions,
} from "@/lib/constants/theme";

const nullableNumberSchema = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) {
    return null;
  }

  return Number(value);
}, z.number().nonnegative().nullable());

const groupValues = bodyPlacementGroups.map((group) => group.value);
const detailValues = bodyPlacementGroups.flatMap((group) =>
  group.details.map((detail) => detail.value),
);
const intentValues = intentOptions.map((intent) => intent.value);
const sizeValues = sizeOptions.map((size) => size.value);
const categoryValues = featuredDesignCategories.map((item) => item.value);
const currencyValues = currencyOptions.map((item) => item.value);

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signUpSchema = loginSchema.extend({
  artistName: z.string().min(2, "Artist name is required."),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters.")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Please confirm your password."),
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords must match.",
});

export const profileSchema = z.object({
  artistName: z.string().min(2),
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and hyphens only."),
  profileImageUrl: z.string().url().nullable().or(z.literal("")),
  coverImageUrl: z.string().url().nullable().or(z.literal("")),
  shortBio: z.string().max(220),
  welcomeHeadline: z.string().max(120),
  whatsappNumber: z.string().min(8),
  instagramHandle: z.string().min(2),
  currency: z.enum(currencyValues as [string, ...string[]]),
  active: z.boolean(),
});

const customStyleSchema = z.object({
  id: z.string().optional(),
  styleKey: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  label: z.string().min(2).max(40),
  enabled: z.boolean().default(true),
});

export const funnelSettingsSchema = z.object({
  introEyebrow: z.string().max(48),
  introTitle: z.string().max(120),
  introDescription: z.string().max(220),
  showFeaturedDesigns: z.boolean(),
  defaultLanguage: z.enum(["en", "tr"]),
  enabledStyles: z.array(z.string().min(1)).default([]),
  customStyles: z.array(customStyleSchema).default([]),
});

export const pricingSchema = z.object({
  minimumSessionPrice: z.coerce.number().min(0),
  sizeBaseRanges: z.object({
    tiny: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
    small: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
    medium: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
    large: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
  }),
  sizeTimeRanges: z.object({
    tiny: z.object({ minHours: z.coerce.number().min(0), maxHours: z.coerce.number().min(0) }),
    small: z.object({ minHours: z.coerce.number().min(0), maxHours: z.coerce.number().min(0) }),
    medium: z.object({ minHours: z.coerce.number().min(0), maxHours: z.coerce.number().min(0) }),
    large: z.object({ minHours: z.coerce.number().min(0), maxHours: z.coerce.number().min(0) }),
  }),
  placementMultipliers: z.record(z.string(), z.coerce.number().min(0.5).max(3)),
  intentMultipliers: z.record(z.enum(intentValues as [string, ...string[]]), z.coerce.number()),
  styleMultipliers: z.record(z.string(), z.coerce.number()),
});

export const featuredDesignSchema = z.object({
  id: z.string().optional(),
  category: z.enum(categoryValues as [string, ...string[]]),
  title: z.string().min(2),
  shortDescription: z.string().min(12).max(180),
  imageUrl: z.string().url().nullable().or(z.literal("")),
  imagePath: z.string().nullable().or(z.literal("")).optional(),
  priceNote: z.string().max(48).nullable().or(z.literal("")).optional(),
  referencePriceMin: nullableNumberSchema.optional(),
  referencePriceMax: nullableNumberSchema.optional(),
  active: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0),
});

export const featuredDesignsSchema = z.object({
  designs: z.array(featuredDesignSchema).min(1),
});

export const submissionSchema = z.object({
  artistSlug: z.string().min(3),
  locale: z.enum(["en", "tr"]).optional(),
  intent: z.enum(intentValues as [string, ...string[]]),
  selectedDesignId: z.string().nullable().optional(),
  referenceImage: z.string().max(255).nullable().optional(),
  referenceImagePath: z.string().max(255).nullable().optional(),
  referenceDescription: z.string().max(280).optional(),
  city: z.string().max(80).optional(),
  preferredStartDate: z.string().max(20).optional(),
  preferredEndDate: z.string().max(20).optional(),
  bodyAreaGroup: z.enum(groupValues as [string, ...string[]]),
  bodyAreaDetail: z.enum(detailValues as [string, ...string[]]),
  sizeMode: z.enum(["quick", "visual"]),
  approximateSizeCm: nullableNumberSchema.optional(),
  sizeCategory: z.enum(sizeValues as [string, ...string[]]),
  widthCm: nullableNumberSchema.optional(),
  heightCm: nullableNumberSchema.optional(),
  style: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export const pageThemeSchema = z.object({
  presetTheme: z.enum(themePresetOptions),
  backgroundType: z.enum(backgroundTypeOptions),
  backgroundColor: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i),
  gradientStart: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i),
  gradientEnd: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i),
  backgroundImageUrl: z.string().url().nullable().or(z.literal("")),
  primaryColor: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i),
  secondaryColor: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i),
  cardColor: z.string().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i),
  cardOpacity: z.coerce.number().min(0.45).max(0.98),
  headingFont: z.enum(
    headingFontOptions.map((item) => item.value) as [
      (typeof headingFontOptions)[number]["value"],
      ...(typeof headingFontOptions)[number]["value"][],
    ],
  ),
  bodyFont: z.enum(
    bodyFontOptions.map((item) => item.value) as [
      (typeof bodyFontOptions)[number]["value"],
      ...(typeof bodyFontOptions)[number]["value"][],
    ],
  ),
  fontPairingPreset: z.enum(fontPairingPresetOptions),
  radiusStyle: z.enum(radiusStyleOptions),
  themeMode: z.enum(themeModeOptions),
  customWelcomeTitle: z.string().max(120).nullable().or(z.literal("")),
  customIntroText: z.string().max(240).nullable().or(z.literal("")),
  customCtaLabel: z.string().max(40).nullable().or(z.literal("")),
  featuredSectionLabel1: z.string().max(48).nullable().or(z.literal("")),
  featuredSectionLabel2: z.string().max(120).nullable().or(z.literal("")),
});
