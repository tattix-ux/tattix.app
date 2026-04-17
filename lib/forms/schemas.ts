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
  styleKey: z.string().default(""),
  label: z.string().min(2).max(40),
  description: z.string().max(140).optional().default(""),
  enabled: z.boolean().default(true),
});

const bookingCitySchema = z.object({
  id: z.string().optional(),
  cityName: z.string().min(2).max(80),
  availableDates: z.array(z.string().max(20)).default([]),
});

const detailCalibrationLevels = ["low", "medium", "high"] as const;
const pricingValidationExampleIds = [
  "text-low-boundary",
  "current-dagger",
  "feather-high-detail",
  "realistic-eye",
  "colored-butterfly",
] as const;
const pricingValidationFeedbackValues = ["looks-right", "slightly-low", "slightly-high"] as const;
const pricingValidationReasonValues = ["size", "detail", "color", "general"] as const;

export const funnelSettingsSchema = z.object({
  introEyebrow: z.string().max(48),
  introTitle: z.string().max(120),
  introDescription: z.string().max(220),
  showFeaturedDesigns: z.boolean(),
  defaultLanguage: z.enum(["en", "tr"]),
  enabledStyles: z.array(z.string().min(1)).default([]),
  removedBuiltInStyles: z.array(z.string().min(1)).default([]),
  customStyles: z.array(customStyleSchema).default([]),
  bookingCities: z.array(bookingCitySchema).default([]),
}).superRefine((values, ctx) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const seen = new Set<string>();

  values.bookingCities.forEach((city, index) => {
    const normalized = city.cityName.trim().toLocaleLowerCase("tr-TR");

    if (seen.has(normalized)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bookingCities", index, "cityName"],
        message: "City names must be unique.",
      });
    } else {
      seen.add(normalized);
    }

    const dateSeen = new Set<string>();
    city.availableDates.forEach((date, dateIndex) => {
      if (dateSeen.has(date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bookingCities", index, "availableDates", dateIndex],
          message: "Dates must be unique for each city.",
        });
      } else {
        dateSeen.add(date);
      }

      const parsedDate = new Date(`${date}T00:00:00`);
      if (Number.isNaN(parsedDate.getTime()) || parsedDate < today) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bookingCities", index, "availableDates", dateIndex],
          message: "Past dates are not allowed.",
        });
      }
    });
  });
});

export const detailCalibrationSubmissionSchema = z.object({
  sampleOrder: z.array(z.string().min(1)).length(9),
  responses: z
    .array(
      z.object({
        sampleId: z.string().min(1),
        selectedDetailLevel: z.enum(detailCalibrationLevels),
      }),
    )
    .length(9),
}).superRefine((values, ctx) => {
  const orderSet = new Set(values.sampleOrder);
  if (orderSet.size !== values.sampleOrder.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sampleOrder"],
      message: "Sample order must be unique.",
    });
  }

  const responseIds = values.responses.map((response) => response.sampleId);
  const responseSet = new Set(responseIds);
  if (responseSet.size !== responseIds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["responses"],
      message: "Responses must contain unique samples.",
    });
  }

  for (const sampleId of values.sampleOrder) {
    if (!responseSet.has(sampleId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["responses"],
        message: "Every sample needs a response.",
      });
      break;
    }
  }
});

export const pricingOnboardingSchema = z.object({
  minimumPrice: z.coerce.number().gt(0),
  roseMedium8cm: z.coerce.number().gt(0),
  roseMedium18cm: z.coerce.number().gt(0),
  roseMedium25cm: z.coerce.number().gt(0),
  roseLow18cm: z.coerce.number().gt(0),
  roseHigh18cm: z.coerce.number().gt(0),
  roseColor18cm: z.coerce.number().gt(0),
  daggerAnchor18cm: z.coerce.number().gt(0),
  finalControl: z
    .object({
      validationRound: z.union([z.literal(1), z.literal(2)]).default(1),
      feedback: z.record(
        z.enum(pricingValidationExampleIds),
        z.enum(pricingValidationFeedbackValues),
      ),
      reasons: z
        .record(z.string(), z.enum(pricingValidationReasonValues))
        .optional()
        .default({}),
    })
    .optional(),
});

export const pricingSchema = z.object({
  basePrice: z.coerce.number().gt(0),
  minimumCharge: z.coerce.number().min(0),
  sizeModifiers: z.object({
    tiny: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
    small: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
    medium: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
    large: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
  }),
  placementModifiers: z.record(
    z.string(),
    z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
  ),
  detailLevelModifiers: z.object({
    simple: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
    standard: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
    detailed: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
  }),
  colorModeModifiers: z.object({
    "black-only": z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
    "black-grey": z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
    "full-color": z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
  }),
  addonFees: z.object({
    coverUp: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
    customDesign: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
  }),
  calibrationAnswers: z
    .object({
      sizeCurve: z.object({
        "8": z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
        "12": z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
        "18": z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
        "25": z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
      }),
      detailLevel: z.object({
        low: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
        medium: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
        high: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
        ultra: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }).optional(),
      }),
      placementDifficulty: z.object({
        easy: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
        medium: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }).optional(),
        hard: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
      }),
      colorMode: z.object({
        black: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
        blackGrey: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
        color: z.object({ min: z.coerce.number().min(0), max: z.coerce.number().min(0) }),
      }),
      validation: z
        .object({
          feedback: z.enum(["looks-right", "slightly-low", "slightly-high"]),
          globalScale: z.coerce.number().min(0.94).max(1.08),
        })
        .optional(),
      finalValidation: z
        .object({
          validationRound: z.union([z.literal(1), z.literal(2)]),
          perExampleFeedback: z.record(
            z.string(),
            z.enum(["looks-right", "slightly-low", "slightly-high"]),
          ),
          appliedGlobalValidationAdjustment: z.coerce.number().min(0.94).max(1.08),
          validationStatus: z.enum([
            "pending",
            "confirmed",
            "adjusted",
            "completed-no-majority",
            "needs-review",
          ]),
          calibratedAndValidated: z.boolean(),
        })
        .optional(),
    })
    .optional(),
}).superRefine((values, ctx) => {
  const rangeEntries = [
    ...Object.entries(values.sizeModifiers).map(([key, range]) => [`sizeModifiers.${key}`, range] as const),
    ...Object.entries(values.placementModifiers).map(([key, range]) => [`placementModifiers.${key}`, range] as const),
    ...Object.entries(values.detailLevelModifiers).map(([key, range]) => [`detailLevelModifiers.${key}`, range] as const),
    ...Object.entries(values.colorModeModifiers).map(([key, range]) => [`colorModeModifiers.${key}`, range] as const),
    ...Object.entries(values.addonFees).map(([key, range]) => [`addonFees.${key}`, range] as const),
    ...(values.calibrationAnswers
      ? [
          ...Object.entries(values.calibrationAnswers.sizeCurve).map(([key, range]) => [`calibrationAnswers.sizeCurve.${key}`, range] as const),
          ...Object.entries(values.calibrationAnswers.detailLevel).map(([key, range]) => [`calibrationAnswers.detailLevel.${key}`, range] as const),
          ...Object.entries(values.calibrationAnswers.placementDifficulty).map(([key, range]) => [`calibrationAnswers.placementDifficulty.${key}`, range] as const),
          ...Object.entries(values.calibrationAnswers.colorMode).map(([key, range]) => [`calibrationAnswers.colorMode.${key}`, range] as const),
        ]
      : []),
  ];

  for (const [path, range] of rangeEntries) {
    if (range.min > range.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: path.split("."),
        message: "Min value cannot be greater than max.",
      });
    }
  }
});

export const featuredDesignSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(2).max(80),
  title: z.string().min(2),
  shortDescription: z.string().max(180).optional().default(""),
  imageUrl: z.string().url().nullable().or(z.literal("")),
  imagePath: z.string().nullable().or(z.literal("")).optional(),
  priceNote: z.string().max(48).nullable().or(z.literal("")).optional(),
  referenceDetailLevel: z.enum(["simple", "standard", "detailed"]).nullable().optional(),
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
  detailLevel: z.enum(["simple", "standard", "detailed"]).optional(),
  colorMode: z.enum(["black-only", "black-grey", "full-color"]).optional(),
  coverUp: z.boolean().optional(),
  customDesign: z.boolean().optional(),
  designType: z.string().max(80).nullable().optional(),
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
