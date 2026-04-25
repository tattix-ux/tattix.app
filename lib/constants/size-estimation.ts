import type { BodyAreaDetailValue } from "@/lib/constants/body-placement";
import type { SizeValue, StyleValue } from "@/lib/constants/options";
import type { PublicLocale } from "@/lib/i18n/public";

export type SizeMode = "quick" | "visual";

export type PlacementSizeConstraint = {
  minCm: number;
  maxCm: number;
  defaultCm: number;
};

export type PlacementSizingGuidance = {
  headline: string;
  supporting: string;
  helperNote: string | null;
  timeEstimate: string | null;
  tone: "soft" | "balanced" | "caution";
};

type SizeThreshold = {
  category: SizeValue;
  min: number;
  max: number;
};

type GuidanceRule = {
  minCm: number;
  maxCm: number;
  headline: Record<PublicLocale, string>;
  supporting: Record<PublicLocale, string>;
  helperNote?: Record<PublicLocale, string>;
  tone?: PlacementSizingGuidance["tone"];
  timeMinutes?: [number, number];
};

const DEFAULT_CONSTRAINT: PlacementSizeConstraint = {
  minCm: 2,
  maxCm: 24,
  defaultCm: 9,
};

export const sizeCategoryThresholds: SizeThreshold[] = [
  { category: "tiny", min: 1, max: 5 },
  { category: "small", min: 6, max: 10 },
  { category: "medium", min: 11, max: 18 },
  { category: "large", min: 19, max: 50 },
];

const placementSizeOverrides: Partial<Record<BodyAreaDetailValue, PlacementSizeConstraint>> = {
  wrist: { minCm: 2, maxCm: 10, defaultCm: 4 },
  "forearm-outer": { minCm: 2, maxCm: 22, defaultCm: 9 },
  "upper-arm-outer": { minCm: 2, maxCm: 22, defaultCm: 10 },
  hand: { minCm: 2, maxCm: 10, defaultCm: 5 },
  "thigh-front": { minCm: 2, maxCm: 30, defaultCm: 14 },
  calf: { minCm: 2, maxCm: 22, defaultCm: 10 },
  ankle: { minCm: 2, maxCm: 8, defaultCm: 4 },
  foot: { minCm: 2, maxCm: 14, defaultCm: 6 },
  "chest-center": { minCm: 2, maxCm: 24, defaultCm: 10 },
  ribs: { minCm: 2, maxCm: 25, defaultCm: 11 },
  stomach: { minCm: 2, maxCm: 24, defaultCm: 10 },
  "upper-back": { minCm: 2, maxCm: 30, defaultCm: 14 },
  "lower-back": { minCm: 2, maxCm: 30, defaultCm: 14 },
  "spine-area": { minCm: 2, maxCm: 28, defaultCm: 13 },
  "neck-side": { minCm: 2, maxCm: 8, defaultCm: 4 },
  "neck-front": { minCm: 2, maxCm: 8, defaultCm: 4 },
  "neck-back": { minCm: 2, maxCm: 8, defaultCm: 4 },
  head: { minCm: 2, maxCm: 12, defaultCm: 5 },
  fingers: { minCm: 2, maxCm: 5, defaultCm: 3 },
  toes: { minCm: 2, maxCm: 5, defaultCm: 3 },
  "placement-not-sure": { minCm: 2, maxCm: 24, defaultCm: 9 },
};

const styleTimeMultiplier: Partial<Record<StyleValue, number>> = {
  "fine-line": 0.95,
  minimal: 0.9,
  lettering: 0.95,
  traditional: 1.05,
  "neo-traditional": 1.1,
  blackwork: 1.1,
  realism: 1.25,
  "micro-realism": 1.2,
  ornamental: 1.15,
  custom: 1,
};

const styleHelperNotes: Partial<Record<StyleValue, Record<PublicLocale, string>>> = {
  "fine-line": {
    en: "Fine line usually looks best when there is enough breathing room between lines.",
    tr: "İnce çizgi işlerde çizgiler arasında biraz boşluk olduğunda sonuç daha temiz görünür.",
  },
  minimal: {
    en: "Minimal designs stay strongest when the composition is kept clean.",
    tr: "Minimal tasarımlar kompozisyon temiz kaldığında çok daha güçlü görünür.",
  },
  blackwork: {
    en: "Dense blackwork can add time depending on fill coverage.",
    tr: "Yoğun blackwork, dolgu alanına göre seans süresini uzatabilir.",
  },
  realism: {
    en: "Realism usually needs more room and time for smoother detail.",
    tr: "Realism, daha yumuşak ve temiz detay için genelde daha fazla alan ve zaman ister.",
  },
  ornamental: {
    en: "Ornamental layouts often benefit from a little more spacing and flow.",
    tr: "Ornamental yerleşimler genelde biraz daha boşluk ve akışla daha iyi görünür.",
  },
};

const sharedRules = {
  compact: [
    {
      minCm: 1,
      maxCm: 4,
      headline: { en: "Good for a subtle placement.", tr: "Daha sade bir yerleşim için uygun." },
      supporting: {
        en: "This stays clean and understated while keeping the tattoo easy to place.",
        tr: "Dövmeyi rahat konumlandırırken temiz ve sakin bir görünüm sağlar.",
      },
      tone: "soft",
      timeMinutes: [30, 60],
    },
    {
      minCm: 5,
      maxCm: 7,
      headline: { en: "A balanced size for this area.", tr: "Bu alan için dengeli bir boyut." },
      supporting: {
        en: "It gives the design enough presence without feeling oversized.",
        tr: "Tasarımı görünür kılar ama fazla büyük hissettirmez.",
      },
      tone: "balanced",
      timeMinutes: [45, 90],
    },
    {
      minCm: 8,
      maxCm: 50,
      headline: {
        en: "This may feel too large for this placement.",
        tr: "Bu seçim bu yerleşim için biraz fazla büyük kalabilir.",
      },
      supporting: {
        en: "Your artist may suggest moving the idea to a nearby larger area.",
        tr: "Sanatçı bu fikri yakındaki daha geniş bir bölgeye taşımayı önerebilir.",
      },
      tone: "caution",
      timeMinutes: [60, 120],
    },
  ] satisfies GuidanceRule[],
  arm: [
    {
      minCm: 1,
      maxCm: 6,
      headline: { en: "This size works well for a minimal arm tattoo.", tr: "Bu boyut minimal kol dövmeleri için iyi çalışır." },
      supporting: {
        en: "It suits cleaner motifs and keeps the placement easy to read.",
        tr: "Daha sade motiflere uyar ve yerleşimin rahat okunmasını sağlar.",
      },
      tone: "soft",
      timeMinutes: [30, 75],
    },
    {
      minCm: 7,
      maxCm: 14,
      headline: { en: "A balanced arm size with room for detail.", tr: "Detay için alan bırakan dengeli bir kol boyutu." },
      supporting: {
        en: "This is a common range for most forearm and upper-arm pieces.",
        tr: "Alt ve üst kol tasarımlarının çoğu için sık tercih edilen bir aralıktır.",
      },
      tone: "balanced",
      timeMinutes: [60, 150],
    },
    {
      minCm: 15,
      maxCm: 50,
      headline: { en: "This is a larger arm piece.", tr: "Bu daha büyük bir kol parçası." },
      supporting: {
        en: "It may need more session time, especially with shading or dense detail.",
        tr: "Özellikle gölgeleme veya yoğun detay varsa daha uzun seans gerekebilir.",
      },
      tone: "balanced",
      timeMinutes: [120, 240],
    },
  ] satisfies GuidanceRule[],
  torso: [
    {
      minCm: 1,
      maxCm: 6,
      headline: { en: "This is a very small size for this area.", tr: "Bu alan için oldukça küçük bir boyut." },
      supporting: {
        en: "It can work, but visible detail may stay limited.",
        tr: "Uygulanabilir ama görünür detay biraz sınırlı kalabilir.",
      },
      tone: "caution",
      timeMinutes: [45, 90],
    },
    {
      minCm: 7,
      maxCm: 16,
      headline: { en: "A balanced size with room for movement.", tr: "Akışa alan bırakan dengeli bir boyut." },
      supporting: {
        en: "This usually gives enough space for cleaner flow on the body.",
        tr: "Bu aralık genelde vücutta daha temiz bir akış için yeterli alan sağlar.",
      },
      tone: "balanced",
      timeMinutes: [75, 150],
    },
    {
      minCm: 17,
      maxCm: 50,
      headline: { en: "This may require more session time.", tr: "Bu seçim daha uzun seans gerektirebilir." },
      supporting: {
        en: "Larger torso placements usually need more careful stencil fitting.",
        tr: "Daha büyük gövde yerleşimleri genelde daha dikkatli stencil çalışması ister.",
      },
      tone: "balanced",
      timeMinutes: [120, 240],
    },
  ] satisfies GuidanceRule[],
  leg: [
    {
      minCm: 1,
      maxCm: 8,
      headline: { en: "This size reads cleanly here.", tr: "Bu boyut burada temiz görünür." },
      supporting: {
        en: "It keeps the tattoo focused without taking over the whole area.",
        tr: "Tüm alanı kaplamadan tasarımı odaklı tutar.",
      },
      tone: "soft",
      timeMinutes: [45, 90],
    },
    {
      minCm: 9,
      maxCm: 18,
      headline: { en: "A balanced size with room for detail and flow.", tr: "Detay ve akış için alan sunan dengeli bir boyut." },
      supporting: {
        en: "This is a practical range for most lower-leg and upper-leg placements.",
        tr: "Alt ve üst bacak yerleşimlerinin çoğu için pratik bir aralıktır.",
      },
      tone: "balanced",
      timeMinutes: [75, 180],
    },
    {
      minCm: 19,
      maxCm: 50,
      headline: { en: "This is a larger leg piece.", tr: "Bu daha büyük bir bacak parçası." },
      supporting: {
        en: "Expect a longer session if the design includes dense fill or texture.",
        tr: "Tasarım yoğun dolgu veya doku içeriyorsa daha uzun seans gerekebilir.",
      },
      tone: "balanced",
      timeMinutes: [150, 300],
    },
  ] satisfies GuidanceRule[],
  back: [
    {
      minCm: 1,
      maxCm: 10,
      headline: { en: "This keeps the back placement compact.", tr: "Bu seçim sırt yerleşimini kompakt tutar." },
      supporting: {
        en: "It works well for a focused idea without using the full back space.",
        tr: "Tüm sırt alanını kaplamadan daha odaklı bir fikir için iyi çalışır.",
      },
      tone: "soft",
      timeMinutes: [60, 120],
    },
    {
      minCm: 11,
      maxCm: 20,
      headline: { en: "A balanced back size with room for structure.", tr: "Yapısal detay için alan sunan dengeli bir sırt boyutu." },
      supporting: {
        en: "There is enough room here for cleaner spacing and flow.",
        tr: "Burada daha temiz boşluk ve akış için yeterli alan vardır.",
      },
      tone: "balanced",
      timeMinutes: [90, 180],
    },
    {
      minCm: 21,
      maxCm: 50,
      headline: { en: "This is moving into a larger back piece.", tr: "Bu seçim daha büyük bir sırt parçasına yaklaşıyor." },
      supporting: {
        en: "Larger back tattoos usually need more planning and session time.",
        tr: "Daha büyük sırt dövmeleri genelde daha fazla planlama ve seans süresi ister.",
      },
      tone: "balanced",
      timeMinutes: [180, 360],
    },
  ] satisfies GuidanceRule[],
};

const placementGuidanceRules: Partial<Record<BodyAreaDetailValue, readonly GuidanceRule[]>> = {
  wrist: sharedRules.compact,
  ankle: sharedRules.compact,
  fingers: sharedRules.compact,
  toes: sharedRules.compact,
  "neck-side": sharedRules.compact,
  "neck-front": sharedRules.compact,
  "neck-back": sharedRules.compact,
  head: sharedRules.compact,
  "placement-not-sure": [
    {
      minCm: 1,
      maxCm: 50,
      headline: { en: "A flexible starting size.", tr: "Esnek bir başlangıç boyutu." },
      supporting: {
        en: "If placement is still open, your artist can refine the size after reviewing the idea.",
        tr: "Yerleşim henüz net değilse sanatçı fikri gördükten sonra boyutu netleştirebilir.",
      },
      tone: "balanced",
      timeMinutes: [45, 150],
    },
  ],
  "upper-arm-outer": sharedRules.arm,
  "forearm-outer": sharedRules.arm,
  hand: sharedRules.arm,
  "thigh-front": sharedRules.leg,
  calf: sharedRules.leg,
  foot: sharedRules.leg,
  "chest-center": sharedRules.torso,
  ribs: sharedRules.torso,
  stomach: sharedRules.torso,
  "upper-back": sharedRules.back,
  "lower-back": sharedRules.back,
  "spine-area": sharedRules.back,
};

export function getPlacementSizeConstraint(detail: BodyAreaDetailValue) {
  return placementSizeOverrides[detail] ?? DEFAULT_CONSTRAINT;
}

export function deriveSizeCategoryFromCm(cm: number): SizeValue {
  const rounded = Math.round(cm);
  return (
    sizeCategoryThresholds.find((threshold) => rounded >= threshold.min && rounded <= threshold.max)
      ?.category ?? "large"
  );
}

export function clampCm(cm: number, constraint: PlacementSizeConstraint) {
  return Math.min(constraint.maxCm, Math.max(constraint.minCm, Math.round(cm)));
}

function roundMinutesToQuarterHour(minutes: number) {
  return Math.max(15, Math.round(minutes / 15) * 15);
}

function formatDurationLabel(minutes: number, locale: PublicLocale) {
  if (minutes < 60) {
    return locale === "tr" ? `${minutes} dk` : `${minutes} min`;
  }

  const hours = minutes / 60;
  const rounded = Number.isInteger(hours) ? String(hours) : hours.toFixed(1);
  return locale === "tr" ? `${rounded} saat` : `${rounded} hour${hours === 1 ? "" : "s"}`;
}

function getTimeEstimate(
  minutes: [number, number] | undefined,
  style?: StyleValue | "" | null,
  locale: PublicLocale = "en",
) {
  if (!minutes) {
    return null;
  }

  const multiplier = style ? styleTimeMultiplier[style] ?? 1 : 1;
  const min = roundMinutesToQuarterHour(minutes[0] * multiplier);
  const max = roundMinutesToQuarterHour(minutes[1] * multiplier);

  return locale === "tr"
    ? `${formatDurationLabel(min, locale)} - ${formatDurationLabel(max, locale)}`
    : `${formatDurationLabel(min, locale)} to ${formatDurationLabel(max, locale)}`;
}

function getRule(detail: BodyAreaDetailValue, cm: number) {
  const rules = placementGuidanceRules[detail] ?? placementGuidanceRules["placement-not-sure"]!;
  return rules.find((rule) => cm >= rule.minCm && cm <= rule.maxCm) ?? rules[rules.length - 1];
}

export function getPlacementSizingGuidance(
  detail: BodyAreaDetailValue,
  cm: number,
  style?: StyleValue | "" | null,
  locale: PublicLocale = "en",
): PlacementSizingGuidance {
  const rule = getRule(detail, cm);
  const styleNote = style ? styleHelperNotes[style]?.[locale] ?? null : null;

  return {
    headline: rule.headline[locale],
    supporting: rule.supporting[locale],
    helperNote: styleNote ?? rule.helperNote?.[locale] ?? null,
    timeEstimate: getTimeEstimate(rule.timeMinutes, style, locale),
    tone: rule.tone ?? "balanced",
  };
}

export function formatApproximateSizeLabel(submission: {
  sizeMode?: SizeMode | null;
  selectedSizeCm?: number | null;
  approximateSizeCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
}) {
  if (submission.selectedSizeCm) {
    return `${Math.round(submission.selectedSizeCm)} cm`;
  }

  if (submission.approximateSizeCm) {
    return `${Math.round(submission.approximateSizeCm)} cm`;
  }

  if (submission.widthCm) {
    return submission.heightCm
      ? `${submission.widthCm} x ${submission.heightCm} cm`
      : `${submission.widthCm} cm`;
  }

  return null;
}
