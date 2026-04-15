"use client";

import { LoaderCircle, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { bodyPlacementGroups } from "@/lib/constants/body-placement";
import { pricingSchema } from "@/lib/forms/schemas";
import type { PublicLocale } from "@/lib/i18n/public";
import type { ArtistPricingRules, ArtistStyleOption, PriceRange } from "@/lib/types";

type PricingPayload = z.output<typeof pricingSchema>;

type DraftRange = {
  min: string;
  max: string;
};

type CalibrationDraft = {
  openingPrice: string;
  size: {
    size8: DraftRange;
    size12: DraftRange;
    size18: DraftRange;
    size25: DraftRange;
  };
  detail: {
    low: DraftRange;
    medium: DraftRange;
    high: DraftRange;
  };
  placement: {
    easy: DraftRange;
    hard: DraftRange;
  };
  color: {
    black: DraftRange;
    color: DraftRange;
  };
};

const DEFAULT_NEUTRAL_RANGE: PriceRange = { min: 1, max: 1.08 };
const DEFAULT_HARD_RANGE: PriceRange = { min: 1.14, max: 1.3 };
const DEFAULT_NOT_SURE_RANGE: PriceRange = { min: 1, max: 1.05 };
const DEFAULT_BLACK_RANGE: PriceRange = { min: 0.94, max: 1 };
const DEFAULT_COLOR_RANGE: PriceRange = { min: 1.18, max: 1.35 };
const DEFAULT_BLACK_GREY_RANGE: PriceRange = { min: 1, max: 1.12 };

const DEFAULT_HARD_PLACEMENTS = new Set([
  "ribs",
  "spine-area",
  "neck-front",
  "neck-side",
  "hand",
  "fingers",
  "foot",
  "toes",
  "ankle",
  "wrist",
  "head",
]);

function roundPrice(value: number) {
  return Math.max(0, Math.round(value));
}

function midpoint(range: PriceRange | undefined) {
  if (!range) {
    return null;
  }

  return (range.min + range.max) / 2;
}

function priceRangeFromFactors(anchorPrice: number, range: PriceRange | undefined, fallback: PriceRange): PriceRange {
  const source = range ?? fallback;

  return {
    min: roundPrice(anchorPrice * source.min),
    max: roundPrice(anchorPrice * source.max),
  };
}

function averageRanges(ranges: PriceRange[], fallback: PriceRange): PriceRange {
  if (!ranges.length) {
    return fallback;
  }

  const min = ranges.reduce((sum, range) => sum + range.min, 0) / ranges.length;
  const max = ranges.reduce((sum, range) => sum + range.max, 0) / ranges.length;

  return {
    min: Number(min.toFixed(4)),
    max: Number(Math.max(min, max).toFixed(4)),
  };
}

function factorRangeFromPriceRange(range: DraftRange, anchorPrice: number, fallback: PriceRange): PriceRange {
  const minPrice = Number(range.min);
  const maxPrice = Number(range.max);

  if (!Number.isFinite(anchorPrice) || anchorPrice <= 0) {
    return fallback;
  }

  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice) || minPrice < 0 || maxPrice < 0) {
    return fallback;
  }

  const min = Number((minPrice / anchorPrice).toFixed(4));
  const max = Number((maxPrice / anchorPrice).toFixed(4));

  return {
    min: Math.max(0, Math.min(min, max)),
    max: Math.max(Math.max(0, min), max),
  };
}

function stringRange(range: PriceRange): DraftRange {
  return {
    min: String(roundPrice(range.min)),
    max: String(roundPrice(Math.max(range.min, range.max))),
  };
}

function collectUniquePlacementDetails() {
  const seen = new Set<string>();

  return bodyPlacementGroups.flatMap((group) =>
    group.details.filter((detail) => {
      if (detail.value === "placement-not-sure") {
        return false;
      }

      if (seen.has(detail.value)) {
        return false;
      }

      seen.add(detail.value);
      return true;
    }),
  );
}

function resolveHardPlacementKeys(pricingRules: ArtistPricingRules) {
  const details = collectUniquePlacementDetails();
  const currentHard = details
    .filter((detail) => midpoint(pricingRules.placementModifiers[detail.value]) !== null)
    .filter((detail) => (midpoint(pricingRules.placementModifiers[detail.value]) ?? 1) >= 1.12)
    .map((detail) => detail.value);

  if (currentHard.length > 0) {
    return new Set(currentHard);
  }

  return DEFAULT_HARD_PLACEMENTS;
}

function derivePlacementDefaults(pricingRules: ArtistPricingRules, anchorPrice: number) {
  const hardKeys = resolveHardPlacementKeys(pricingRules);
  const details = collectUniquePlacementDetails();
  const easyRanges: PriceRange[] = [];
  const hardRanges: PriceRange[] = [];

  for (const detail of details) {
    const range = pricingRules.placementModifiers[detail.value];
    if (!range) {
      continue;
    }

    if (hardKeys.has(detail.value)) {
      hardRanges.push(range);
    } else {
      easyRanges.push(range);
    }
  }

  return {
    hardKeys,
    easy: priceRangeFromFactors(anchorPrice, averageRanges(easyRanges, DEFAULT_NEUTRAL_RANGE), DEFAULT_NEUTRAL_RANGE),
    hard: priceRangeFromFactors(anchorPrice, averageRanges(hardRanges, DEFAULT_HARD_RANGE), DEFAULT_HARD_RANGE),
  };
}

function interpolateRange(left: PriceRange, right: PriceRange, mix = 0.5): PriceRange {
  const safeMix = Math.min(1, Math.max(0, mix));

  return {
    min: Number((left.min + (right.min - left.min) * safeMix).toFixed(4)),
    max: Number((left.max + (right.max - left.max) * safeMix).toFixed(4)),
  };
}

function buildInitialDraft(pricingRules: ArtistPricingRules): CalibrationDraft {
  const anchorPrice = Math.max(pricingRules.anchorPrice || pricingRules.basePrice || 0, 100);
  const placementDefaults = derivePlacementDefaults(pricingRules, anchorPrice);

  return {
    openingPrice: String(roundPrice(anchorPrice)),
    size: {
      size8: stringRange(priceRangeFromFactors(anchorPrice, pricingRules.sizeModifiers.tiny, { min: 0.35, max: 0.6 })),
      size12: stringRange(priceRangeFromFactors(anchorPrice, pricingRules.sizeModifiers.small, { min: 0.55, max: 0.85 })),
      size18: stringRange(priceRangeFromFactors(anchorPrice, pricingRules.sizeModifiers.medium, { min: 0.95, max: 1.2 })),
      size25: stringRange(priceRangeFromFactors(anchorPrice, pricingRules.sizeModifiers.large, { min: 1.8, max: 2.4 })),
    },
    detail: {
      low: stringRange(priceRangeFromFactors(anchorPrice, pricingRules.detailLevelModifiers.simple, { min: 0.92, max: 1 })),
      medium: stringRange(priceRangeFromFactors(anchorPrice, pricingRules.detailLevelModifiers.standard, { min: 1, max: 1.12 })),
      high: stringRange(priceRangeFromFactors(anchorPrice, pricingRules.detailLevelModifiers.detailed, { min: 1.12, max: 1.28 })),
    },
    placement: {
      easy: stringRange(placementDefaults.easy),
      hard: stringRange(placementDefaults.hard),
    },
    color: {
      black: stringRange(priceRangeFromFactors(anchorPrice, pricingRules.colorModeModifiers["black-only"], DEFAULT_BLACK_RANGE)),
      color: stringRange(priceRangeFromFactors(anchorPrice, pricingRules.colorModeModifiers["full-color"], DEFAULT_COLOR_RANGE)),
    },
  };
}

function updateDraftRange(
  current: CalibrationDraft,
  section: keyof Omit<CalibrationDraft, "openingPrice">,
  key: string,
  edge: keyof DraftRange,
  value: string,
): CalibrationDraft {
  return {
    ...current,
    [section]: {
      ...current[section],
      [key]: {
        ...(current[section] as Record<string, DraftRange>)[key],
        [edge]: value,
      },
    },
  } as CalibrationDraft;
}

function buildCalibrationSlots(existing: ArtistPricingRules["calibrationReferenceSlots"]) {
  const defaults = [
    { slotId: "size-8cm", axis: "size", key: "8cm", label: "8 cm referans slotu", assetRef: null },
    { slotId: "size-12cm", axis: "size", key: "12cm", label: "12 cm referans slotu", assetRef: null },
    { slotId: "size-18cm", axis: "size", key: "18cm", label: "18 cm referans slotu", assetRef: null },
    { slotId: "size-25cm", axis: "size", key: "25cm", label: "25 cm referans slotu", assetRef: null },
    { slotId: "detail-low", axis: "detailLevel", key: "low", label: "Az detay referans slotu", assetRef: null },
    { slotId: "detail-medium", axis: "detailLevel", key: "medium", label: "Orta detay referans slotu", assetRef: null },
    { slotId: "detail-high", axis: "detailLevel", key: "high", label: "Çok detay referans slotu", assetRef: null },
    { slotId: "placement-easy", axis: "placement", key: "easy", label: "Kolay bölge referans slotu", assetRef: null },
    { slotId: "placement-hard", axis: "placement", key: "hard", label: "Zor bölge referans slotu", assetRef: null },
    { slotId: "color-black", axis: "colorMode", key: "black", label: "Siyah referans slotu", assetRef: null },
    { slotId: "color-color", axis: "colorMode", key: "color", label: "Renkli referans slotu", assetRef: null },
  ] as const;

  return defaults.map((slot) => {
    const existingSlot = existing.find((item) => item.slotId === slot.slotId);
    return existingSlot
      ? { ...existingSlot, axis: slot.axis, key: slot.key, label: slot.label }
      : { ...slot };
  });
}

function buildPayloadFromDraft(draft: CalibrationDraft, pricingRules: ArtistPricingRules): PricingPayload {
  const anchorPrice = Math.max(Number(draft.openingPrice) || 0, 1);
  const openingRange: PriceRange = { min: 1, max: 1 };
  const easyPlacement = factorRangeFromPriceRange(draft.placement.easy, anchorPrice, DEFAULT_NEUTRAL_RANGE);
  const hardPlacement = factorRangeFromPriceRange(draft.placement.hard, anchorPrice, DEFAULT_HARD_RANGE);
  const hardKeys = resolveHardPlacementKeys(pricingRules);
  const placementModifiers = Object.fromEntries(
    bodyPlacementGroups.flatMap((group) =>
      group.details.map((detail) => [
        detail.value,
        detail.value === "placement-not-sure"
          ? DEFAULT_NOT_SURE_RANGE
          : hardKeys.has(detail.value)
            ? hardPlacement
            : easyPlacement,
      ]),
    ),
  );

  const blackOnly = factorRangeFromPriceRange(draft.color.black, anchorPrice, DEFAULT_BLACK_RANGE);
  const fullColor = factorRangeFromPriceRange(draft.color.color, anchorPrice, DEFAULT_COLOR_RANGE);
  const blackGrey = interpolateRange(blackOnly, fullColor, 0.45);

  return {
    basePrice: anchorPrice,
    minimumCharge: anchorPrice,
    sizeModifiers: {
      tiny: factorRangeFromPriceRange(draft.size.size8, anchorPrice, { min: 0.35, max: 0.6 }),
      small: factorRangeFromPriceRange(draft.size.size12, anchorPrice, { min: 0.55, max: 0.85 }),
      medium: factorRangeFromPriceRange(draft.size.size18, anchorPrice, { min: 0.95, max: 1.2 }),
      large: factorRangeFromPriceRange(draft.size.size25, anchorPrice, { min: 1.8, max: 2.4 }),
    },
    placementModifiers,
    detailLevelModifiers: {
      simple: factorRangeFromPriceRange(draft.detail.low, anchorPrice, { min: 0.92, max: 1 }),
      standard: factorRangeFromPriceRange(draft.detail.medium, anchorPrice, openingRange),
      detailed: factorRangeFromPriceRange(draft.detail.high, anchorPrice, { min: 1.12, max: 1.28 }),
    },
    colorModeModifiers: {
      "black-only": blackOnly,
      "black-grey": blackGrey,
      "full-color": fullColor,
    },
    addonFees: pricingRules.addonFees,
    calibrationAnswers: {
      sizeCurve: {
        "8": {
          min: Number(draft.size.size8.min),
          max: Number(draft.size.size8.max),
        },
        "12": {
          min: Number(draft.size.size12.min),
          max: Number(draft.size.size12.max),
        },
        "18": {
          min: Number(draft.size.size18.min),
          max: Number(draft.size.size18.max),
        },
        "25": {
          min: Number(draft.size.size25.min),
          max: Number(draft.size.size25.max),
        },
      },
      detailLevel: {
        low: {
          min: Number(draft.detail.low.min),
          max: Number(draft.detail.low.max),
        },
        medium: {
          min: Number(draft.detail.medium.min),
          max: Number(draft.detail.medium.max),
        },
        high: {
          min: Number(draft.detail.high.min),
          max: Number(draft.detail.high.max),
        },
      },
      placementDifficulty: {
        easy: {
          min: Number(draft.placement.easy.min),
          max: Number(draft.placement.easy.max),
        },
        hard: {
          min: Number(draft.placement.hard.min),
          max: Number(draft.placement.hard.max),
        },
      },
      colorMode: {
        black: {
          min: Number(draft.color.black.min),
          max: Number(draft.color.black.max),
        },
        color: {
          min: Number(draft.color.color.min),
          max: Number(draft.color.color.max),
        },
      },
    },
  };
}

function getText(locale: PublicLocale) {
  if (locale === "tr") {
    return {
      title: "Fiyat kalibrasyonu",
      description: "Tattix’e birkaç örnek fiyat ver. Sistem bu örneklerden tahmin modelini kurar.",
      openingPrice: "Başlangıç fiyatın",
      openingPriceHelp: "Küçük ve standart bir dövmeyi genelde kaçtan başlatıyorsun?",
      openingPriceNote: "Bu değer modelin taban fiyatı olarak kullanılır.",
      placeholderTitle: "Referans görsel slotu",
      placeholderDescription: "Görseli sonra sen yükleyeceksin. Şimdilik sadece yerini hazırlıyoruz.",
      rangeMin: "Minimum",
      rangeMax: "Maksimum",
      back: "Geri",
      next: "Devam",
      save: "Kalibrasyonu kaydet",
      saving: "Kaydediliyor",
      saveFailed: "Fiyat kalibrasyonu kaydedilemedi.",
      saved: "Fiyat kalibrasyonu kaydedildi.",
      invalid: "Lütfen tüm fiyat aralıklarını doldur.",
      stepLabel: "Adım",
      sizeTitle: "Boyut eğrisi",
      sizeDescription: "Aynı dövmeyi farklı boyutlarda yaklaşık hangi aralıkta fiyatlarsın?",
      sizeAssumption: "Varsayım: siyah, orta detay, standart bölge, özel tasarım yok, kapatma yok.",
      detailTitle: "Detay farkı",
      detailDescription: "Aynı boyut ve aynı bölge için detay arttıkça fiyatın nasıl değişiyor?",
      detailAssumption: "Varsayım: aynı boyut, siyah, standart bölge.",
      placementTitle: "Bölge farkı",
      placementDescription: "Aynı boyut ve benzer iş için kolay ve zor bölgede nasıl fiyatlıyorsun?",
      placementAssumption: "Varsayım: aynı boyut, benzer dövme, siyah.",
      colorTitle: "Renk farkı",
      colorDescription: "Aynı boyut ve benzer iş için siyah ve renkli fiyatların nasıl ayrışıyor?",
      colorAssumption: "Varsayım: aynı boyut, benzer detay, standart bölge.",
      size8: "8 cm",
      size12: "12 cm",
      size18: "18 cm",
      size25: "25 cm",
      detailLow: "Az detay",
      detailMedium: "Orta detay",
      detailHigh: "Çok detay",
      placementEasy: "Kolay bölge",
      placementHard: "Zor bölge",
      colorBlack: "Sadece siyah",
      colorColor: "Renkli",
    };
  }

  return {
    title: "Pricing calibration",
    description: "Give Tattix a few example price ranges. It will build the quote model from them.",
    openingPrice: "Opening price",
    openingPriceHelp: "What do you usually start a small, standard tattoo at?",
    openingPriceNote: "This becomes the anchor price of the model.",
    placeholderTitle: "Reference image slot",
    placeholderDescription: "You will upload the real reference later. For now we only keep the slot ready.",
    rangeMin: "Min",
    rangeMax: "Max",
    back: "Back",
    next: "Continue",
    save: "Save calibration",
    saving: "Saving",
    saveFailed: "Unable to save pricing calibration.",
    saved: "Pricing calibration saved.",
    invalid: "Please fill every price range.",
    stepLabel: "Step",
    sizeTitle: "Size curve",
    sizeDescription: "How would you price the same tattoo at these sizes?",
    sizeAssumption: "Assume black ink, medium detail, standard placement, no custom design, no cover-up.",
    detailTitle: "Detail difference",
    detailDescription: "At the same size and placement, how does the price shift with detail?",
    detailAssumption: "Assume same size, black ink, standard placement.",
    placementTitle: "Placement difference",
    placementDescription: "For a similar tattoo at the same size, how does easy vs hard placement change the range?",
    placementAssumption: "Assume same size, similar tattoo, black ink.",
    colorTitle: "Color difference",
    colorDescription: "For a similar tattoo at the same size, how do black and color differ?",
    colorAssumption: "Assume same size, similar detail, standard placement.",
    size8: "8 cm",
    size12: "12 cm",
    size18: "18 cm",
    size25: "25 cm",
    detailLow: "Low detail",
    detailMedium: "Medium detail",
    detailHigh: "High detail",
    placementEasy: "Easy placement",
    placementHard: "Hard placement",
    colorBlack: "Black",
    colorColor: "Color",
  };
}

function RangeQuestion({
  label,
  value,
  onChange,
  minLabel,
  maxLabel,
}: {
  label: string;
  value: DraftRange;
  onChange: (edge: keyof DraftRange, next: string) => void;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/8 bg-black/20 p-4">
      <p className="font-medium text-white">{label}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label={minLabel}>
          <Input type="number" value={value.min} onChange={(event) => onChange("min", event.target.value)} />
        </Field>
        <Field label={maxLabel}>
          <Input type="number" value={value.max} onChange={(event) => onChange("max", event.target.value)} />
        </Field>
      </div>
    </div>
  );
}

export function PricingForm({
  pricingRules,
  styles: _styles,
  locale = "en",
}: {
  pricingRules: ArtistPricingRules;
  styles: ArtistStyleOption[];
  locale?: PublicLocale;
}) {
  const router = useRouter();
  const copy = getText(locale);
  const [activeStep, setActiveStep] = useState(0);
  const [draft, setDraft] = useState<CalibrationDraft>(() => buildInitialDraft(pricingRules));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const slots = buildCalibrationSlots(pricingRules.calibrationReferenceSlots);

  const steps = [
    {
      key: "size",
      title: copy.sizeTitle,
      description: copy.sizeDescription,
      assumption: copy.sizeAssumption,
      slotLabels: slots.filter((slot) => slot.axis === "size").map((slot) => slot.label),
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <RangeQuestion
            label={copy.size8}
            value={draft.size.size8}
            minLabel={copy.rangeMin}
            maxLabel={copy.rangeMax}
            onChange={(edge, value) => setDraft((current) => updateDraftRange(current, "size", "size8", edge, value))}
          />
          <RangeQuestion
            label={copy.size12}
            value={draft.size.size12}
            minLabel={copy.rangeMin}
            maxLabel={copy.rangeMax}
            onChange={(edge, value) => setDraft((current) => updateDraftRange(current, "size", "size12", edge, value))}
          />
          <RangeQuestion
            label={copy.size18}
            value={draft.size.size18}
            minLabel={copy.rangeMin}
            maxLabel={copy.rangeMax}
            onChange={(edge, value) => setDraft((current) => updateDraftRange(current, "size", "size18", edge, value))}
          />
          <RangeQuestion
            label={copy.size25}
            value={draft.size.size25}
            minLabel={copy.rangeMin}
            maxLabel={copy.rangeMax}
            onChange={(edge, value) => setDraft((current) => updateDraftRange(current, "size", "size25", edge, value))}
          />
        </div>
      ),
    },
    {
      key: "detail",
      title: copy.detailTitle,
      description: copy.detailDescription,
      assumption: copy.detailAssumption,
      slotLabels: slots.filter((slot) => slot.axis === "detailLevel").map((slot) => slot.label),
      content: (
        <div className="grid gap-4 lg:grid-cols-3">
          <RangeQuestion
            label={copy.detailLow}
            value={draft.detail.low}
            minLabel={copy.rangeMin}
            maxLabel={copy.rangeMax}
            onChange={(edge, value) => setDraft((current) => updateDraftRange(current, "detail", "low", edge, value))}
          />
          <RangeQuestion
            label={copy.detailMedium}
            value={draft.detail.medium}
            minLabel={copy.rangeMin}
            maxLabel={copy.rangeMax}
            onChange={(edge, value) => setDraft((current) => updateDraftRange(current, "detail", "medium", edge, value))}
          />
          <RangeQuestion
            label={copy.detailHigh}
            value={draft.detail.high}
            minLabel={copy.rangeMin}
            maxLabel={copy.rangeMax}
            onChange={(edge, value) => setDraft((current) => updateDraftRange(current, "detail", "high", edge, value))}
          />
        </div>
      ),
    },
    {
      key: "placement",
      title: copy.placementTitle,
      description: copy.placementDescription,
      assumption: copy.placementAssumption,
      slotLabels: slots.filter((slot) => slot.axis === "placement").map((slot) => slot.label),
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <RangeQuestion
            label={copy.placementEasy}
            value={draft.placement.easy}
            minLabel={copy.rangeMin}
            maxLabel={copy.rangeMax}
            onChange={(edge, value) => setDraft((current) => updateDraftRange(current, "placement", "easy", edge, value))}
          />
          <RangeQuestion
            label={copy.placementHard}
            value={draft.placement.hard}
            minLabel={copy.rangeMin}
            maxLabel={copy.rangeMax}
            onChange={(edge, value) => setDraft((current) => updateDraftRange(current, "placement", "hard", edge, value))}
          />
        </div>
      ),
    },
    {
      key: "color",
      title: copy.colorTitle,
      description: copy.colorDescription,
      assumption: copy.colorAssumption,
      slotLabels: slots.filter((slot) => slot.axis === "colorMode").map((slot) => slot.label),
      content: (
        <div className="grid gap-4 lg:grid-cols-2">
          <RangeQuestion
            label={copy.colorBlack}
            value={draft.color.black}
            minLabel={copy.rangeMin}
            maxLabel={copy.rangeMax}
            onChange={(edge, value) => setDraft((current) => updateDraftRange(current, "color", "black", edge, value))}
          />
          <RangeQuestion
            label={copy.colorColor}
            value={draft.color.color}
            minLabel={copy.rangeMin}
            maxLabel={copy.rangeMax}
            onChange={(edge, value) => setDraft((current) => updateDraftRange(current, "color", "color", edge, value))}
          />
        </div>
      ),
    },
  ];

  async function onSubmit() {
    setStatusMessage(null);

    const payload = buildPayloadFromDraft(draft, pricingRules);
    const parsed = pricingSchema.safeParse(payload);

    if (!parsed.success) {
      setStatusMessage(copy.invalid);
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/dashboard/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });
      await response.json().catch(() => null);

      if (!response.ok) {
        setStatusMessage(copy.saveFailed);
        return;
      }

      setStatusMessage(copy.saved);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  const currentStep = steps[activeStep];

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
            <Field label={copy.openingPrice}>
              <Input
                type="number"
                value={draft.openingPrice}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    openingPrice: event.target.value,
                  }))
                }
              />
            </Field>
            <p className="mt-3 text-sm text-[var(--foreground-muted)]">{copy.openingPriceHelp}</p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.openingPriceNote}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {steps.map((step, index) => {
              const active = index === activeStep;

              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className="rounded-[16px] border px-3 py-3 text-left transition"
                  style={{
                    borderColor: active ? "var(--primary)" : "rgba(255,255,255,0.08)",
                    backgroundColor: active
                      ? "color-mix(in srgb, var(--primary) 18%, transparent)"
                      : "rgba(255,255,255,0.02)",
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
                    {copy.stepLabel} {index + 1}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">{step.title}</p>
                </button>
              );
            })}
          </div>

          <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">
              {copy.stepLabel} {activeStep + 1}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">{currentStep.title}</h3>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">{currentStep.description}</p>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">{currentStep.assumption}</p>

            <div className="mt-4 rounded-[18px] border border-dashed border-white/12 bg-black/20 p-4">
              <p className="text-sm font-medium text-white">{copy.placeholderTitle}</p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.placeholderDescription}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentStep.slotLabels.map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-xs text-[var(--foreground-muted)]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5">{currentStep.content}</div>
          </div>

          {statusMessage ? (
            <p className="text-sm text-[var(--accent-soft)]">{statusMessage}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {activeStep > 0 ? (
              <Button type="button" variant="ghost" onClick={() => setActiveStep((current) => current - 1)}>
                {copy.back}
              </Button>
            ) : null}

            {activeStep < steps.length - 1 ? (
              <Button type="button" onClick={() => setActiveStep((current) => current + 1)}>
                {copy.next}
              </Button>
            ) : (
              <Button type="button" onClick={onSubmit} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    {copy.saving}
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    {copy.save}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
