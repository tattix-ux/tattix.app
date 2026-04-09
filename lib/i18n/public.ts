import type {
  BodyAreaDetailValue,
  PlacementCategoryValue,
} from "@/lib/constants/body-placement";
import type {
  FeaturedCategoryValue,
  IntentValue,
  SizeValue,
  StyleValue,
} from "@/lib/constants/options";

export type PublicLocale = "en" | "tr";

type LocalizedText = Record<PublicLocale, string>;

function pick(text: LocalizedText, locale: PublicLocale) {
  return text[locale];
}

const intentLabels: Record<IntentValue, LocalizedText> = {
  "custom-tattoo": { en: "Custom tattoo", tr: "Özel tasarım dövme" },
  "design-in-mind": { en: "I have a design in mind", tr: "Aklımda bir tasarım var" },
  "flash-design": { en: "Flash design", tr: "Flash tasarım" },
  "discounted-design": { en: "Discounted design", tr: "İndirimli tasarım" },
  "not-sure": { en: "I'm not sure", tr: "Henüz emin değilim" },
};

const sizeLabels: Record<SizeValue, LocalizedText> = {
  tiny: { en: "Tiny", tr: "Çok küçük" },
  small: { en: "Small", tr: "Küçük" },
  medium: { en: "Medium", tr: "Orta" },
  large: { en: "Large", tr: "Büyük" },
};

const styleLabels: Record<StyleValue, LocalizedText> = {
  "fine-line": { en: "Fine line", tr: "İnce çizgi" },
  minimal: { en: "Minimal", tr: "Minimal" },
  traditional: { en: "Traditional", tr: "Traditional" },
  "neo-traditional": { en: "Neo traditional", tr: "Neo traditional" },
  blackwork: { en: "Blackwork", tr: "Blackwork" },
  realism: { en: "Realism", tr: "Realism" },
  "micro-realism": { en: "Micro realism", tr: "Micro realism" },
  ornamental: { en: "Ornamental", tr: "Ornamental" },
  lettering: { en: "Lettering", tr: "Yazı" },
  custom: { en: "Custom", tr: "Özel" },
};

const featuredCategoryLabels: Record<FeaturedCategoryValue, LocalizedText> = {
  "discounted-designs": { en: "Discounted designs", tr: "İndirimli tasarımlar" },
  "flash-designs": { en: "Flash designs", tr: "Flash tasarımlar" },
};

const placementDetailLabels: Record<BodyAreaDetailValue, LocalizedText> = {
  "upper-arm-outer": { en: "Upper arm", tr: "Üst kol" },
  "forearm-outer": { en: "Lower arm", tr: "Alt kol" },
  wrist: { en: "Wrist", tr: "Bilek" },
  hand: { en: "Hand", tr: "El" },
  "thigh-front": { en: "Upper leg", tr: "Üst bacak" },
  calf: { en: "Lower leg", tr: "Alt bacak" },
  ankle: { en: "Ankle", tr: "Ayak bileği" },
  foot: { en: "Foot", tr: "Ayak" },
  "chest-center": { en: "Chest", tr: "Göğüs" },
  ribs: { en: "Ribs", tr: "Kaburga" },
  stomach: { en: "Stomach", tr: "Karın" },
  "upper-back": { en: "Upper back", tr: "Üst sırt" },
  "lower-back": { en: "Lower back", tr: "Alt sırt" },
  "spine-area": { en: "Spine", tr: "Omurga hattı" },
  "neck-side": { en: "Neck side", tr: "Boyun yanı" },
  "neck-front": { en: "Neck front", tr: "Boyun önü" },
  "neck-back": { en: "Neck back", tr: "Boyun arkası" },
  head: { en: "Head", tr: "Baş" },
  fingers: { en: "Fingers", tr: "Parmaklar" },
  toes: { en: "Toes", tr: "Ayak parmakları" },
  "placement-not-sure": { en: "I'm not sure", tr: "Henüz emin değilim" },
};

const placementCategoryLabels: Record<PlacementCategoryValue, LocalizedText> = {
  arm: { en: "Arm", tr: "Kol" },
  leg: { en: "Leg", tr: "Bacak" },
  torso: { en: "Torso", tr: "Gövde" },
  back: { en: "Back", tr: "Sırt" },
  neck: { en: "Neck", tr: "Boyun" },
  head: { en: "Head", tr: "Baş" },
  hand: { en: "Hand", tr: "El" },
  foot: { en: "Foot", tr: "Ayak" },
  "not-sure": { en: "I'm not sure", tr: "Henüz emin değilim" },
};

const placementCategoryDescriptions: Record<PlacementCategoryValue, LocalizedText> = {
  arm: { en: "Upper arm, lower arm, wrist, or hand", tr: "Üst kol, alt kol, bilek veya el" },
  leg: { en: "Upper leg, lower leg, ankle, or foot", tr: "Üst bacak, alt bacak, ayak bileği veya ayak" },
  torso: { en: "Chest, ribs, or stomach", tr: "Göğüs, kaburga veya karın" },
  back: { en: "Upper back, lower back, or spine", tr: "Üst sırt, alt sırt veya omurga" },
  neck: { en: "Front, side, or back of neck", tr: "Boynun ön, yan veya arka kısmı" },
  head: { en: "Head-focused placement", tr: "Baş bölgesi" },
  hand: { en: "Hand or fingers", tr: "El veya parmaklar" },
  foot: { en: "Foot or toes", tr: "Ayak veya ayak parmakları" },
  "not-sure": { en: "You can keep browsing even if placement is not clear yet", tr: "Yerleşim net değilse yine de devam edebilirsin" },
};

export const publicCopy = {
  en: {
    language: "Language",
    stepLabel: "Step",
    stepTitles: [
      "What are you looking for?",
      "Where will it go?",
      "How big should it be?",
      "Which style fits best?",
      "Anything else to know?",
      "Your estimate",
    ],
    stepDescriptions: [
      "Pick the request type and, if needed, choose a ready-made design.",
      "Choose the placement group and exact area.",
      "Set the tattoo size in centimeters.",
      "Choose a style when the design is not pre-made.",
      "Add any extra context before the estimate is calculated.",
      "We are preparing your tattoo estimate.",
    ],
    featuredEyebrow: "Featured collections",
    featuredTitle: "Artist designs available for this request",
    placementCategoryLabel: "Placement group",
    placementCategoryHelp: "Pick the broad area first. Tapping the same option again clears it.",
    placementDetailLabel: "Placement detail",
    placementDetailHelpPrefix: "Choose the exact placement inside",
    currentPlacement: "Current placement",
    noPlacementSelected: "No placement selected yet",
    currentPlacementHelp: "Changing the parent group resets the child placement automatically.",
    selectPlacementFirst: "Select a placement first",
    selectPlacementHelp: "Choose a placement in the previous step to unlock the size slider.",
    approximateTattooSize: "Tattoo size",
    adjustSliderFor: "Adjust the slider for",
    approxSize: "Selected size",
    currentRange: "Current range",
    approximateTime: "Approximate time",
    notesPlaceholder: "Optional notes, references, symbolism, color preferences, or exact vibe.",
    notesHelper: "This extra context will be included in the handoff message for the artist.",
    estimatedRange: "Estimated range",
    sendWhatsapp: "Send via WhatsApp",
    copyMessage: "Copy message",
    copiedForInstagram: "Copied for Instagram DM",
    back: "Back",
    next: "Next",
    calculating: "Calculating...",
    calculatingTitle: "Calculating your estimate",
    calculatingBody: "Checking placement, size, and pricing rules before we show your range.",
    startOver: "Start over",
    defaultPrimaryCta: "See my estimate",
    disclaimer: "This is an approximate estimate. Final price may change after consultation.",
    chooseDesign: "Choose a design",
    chooseDesignHelp: "Select one uploaded design before you continue.",
    noMatchingDesigns: "No matching designs are live right now.",
    referenceUploadLabel: "Reference image",
    referenceUploadHelp: "Optional. Add an image if you already have a concept in mind.",
    uploadReference: "Upload reference",
    referenceSelected: "Selected reference",
    referenceImageUrl: "Reference image URL",
    referenceDescriptionLabel: "Short design description",
    referenceDescriptionPlaceholder: "Describe the idea briefly before continuing.",
    readyMadeDesign: "Selected design",
    styleSkippedNote: "Style is skipped for ready-made designs. The artist can refine it later in chat.",
    viewDesignDetails: "View details",
    selectThisDesign: "Select this design",
    unselectDesign: "Unselect design",
    summaryLabels: {
      intent: "Intent",
      selectedDesign: "Selected design",
      placement: "Placement",
      size: "Size",
      approximateSize: "Approximate size",
      style: "Style",
      referenceImage: "Reference image uploaded",
      referenceImageUrl: "Reference image URL",
      referenceDescription: "Reference description",
      notes: "Notes",
      noNotes: "No additional notes.",
      estimatedPriceShown: "Estimated price shown",
    },
  },
  tr: {
    language: "Dil",
    stepLabel: "Adım",
    stepTitles: [
      "Nasıl bir dövme istiyorsun?",
      "Nereye yapılacak?",
      "Boyutu ne kadar olsun?",
      "Hangi stil daha uygun?",
      "Eklemek istediğin başka bir şey var mı?",
      "Tahminin hazır",
    ],
    stepDescriptions: [
      "Talep türünü seç. Gerekirse hazır bir tasarım da seçebilirsin.",
      "Önce bölgeyi, ardından tam yerleşimi seç.",
      "Dövme boyutunu santimetre olarak ayarla.",
      "Hazır tasarım seçmediysen stilini belirle.",
      "Tahminden önce ek bilgi bırakabilirsin.",
      "Dövme tahminin hazırlanıyor.",
    ],
    featuredEyebrow: "Seçili koleksiyonlar",
    featuredTitle: "Bu talep için uygun tasarımlar",
    placementCategoryLabel: "Yerleşim bölgesi",
    placementCategoryHelp: "Önce genel bölgeyi seç. Aynı seçeneğe tekrar dokunursan seçim kaldırılır.",
    placementDetailLabel: "Yerleşim detayı",
    placementDetailHelpPrefix: "Bu alan içindeki tam bölgeyi seç:",
    currentPlacement: "Seçili yerleşim",
    noPlacementSelected: "Henüz bir yerleşim seçilmedi",
    currentPlacementHelp: "Üst bölge değişirse alt seçim otomatik olarak sıfırlanır.",
    selectPlacementFirst: "Önce yerleşim seç",
    selectPlacementHelp: "Boyut kaydırıcısını açmak için önce yerleşim belirle.",
    approximateTattooSize: "Yaklaşık dövme boyutu",
    adjustSliderFor: "Kaydırıcıyı şu bölge için ayarla:",
    approxSize: "Seçilen boyut",
    currentRange: "Geçerli aralık",
    approximateTime: "Yaklaşık süre",
    notesPlaceholder: "İsteğe bağlı notlar, referanslar, anlam, renk tercihleri veya istediğin genel hava.",
    notesHelper: "Bu bilgiler sanatçıya gidecek ön mesajın içine eklenir.",
    estimatedRange: "Tahmini fiyat aralığı",
    sendWhatsapp: "WhatsApp ile gönder",
    copyMessage: "Mesajı kopyala",
    copiedForInstagram: "Instagram DM için kopyalandı",
    back: "Geri",
    next: "Devam et",
    calculating: "Hesaplanıyor...",
    calculatingTitle: "Tahminin hazırlanıyor",
    calculatingBody: "Yerleşim, boyut ve fiyat kuralları kontrol edilerek tahmin aralığı oluşturuluyor.",
    startOver: "Baştan başla",
    defaultPrimaryCta: "Tahminimi gör",
    disclaimer: "Bu yaklaşık bir tahmindir. Nihai fiyat görüşmeden sonra değişebilir.",
    chooseDesign: "Bir tasarım seç",
    chooseDesignHelp: "Devam etmeden önce yüklenen tasarımlardan birini seç.",
    noMatchingDesigns: "Bu kategori için şu anda aktif tasarım görünmüyor.",
    referenceUploadLabel: "Referans görsel",
    referenceUploadHelp: "İsteğe bağlı. Aklında bir fikir varsa görsel ekleyebilirsin.",
    uploadReference: "Referans yükle",
    referenceSelected: "Seçilen referans",
    referenceImageUrl: "Referans görsel bağlantısı",
    referenceDescriptionLabel: "Kısa tasarım açıklaması",
    referenceDescriptionPlaceholder: "Devam etmeden önce fikrini kısaca anlat.",
    readyMadeDesign: "Seçilen tasarım",
    styleSkippedNote: "Hazır tasarım seçildiğinde stil adımı atlanır. Sanatçı detayları sohbette netleştirebilir.",
    viewDesignDetails: "Detayları gör",
    selectThisDesign: "Bu tasarımı seç",
    unselectDesign: "Tasarımı kaldır",
    summaryLabels: {
      intent: "Talep",
      selectedDesign: "Seçilen tasarım",
      placement: "Yerleşim",
      size: "Boyut",
      approximateSize: "Yaklaşık boyut",
      style: "Stil",
      referenceImage: "Referans görsel yüklendi",
      referenceImageUrl: "Referans görsel bağlantısı",
      referenceDescription: "Referans açıklaması",
      notes: "Notlar",
      noNotes: "Ek not bırakılmadı.",
      estimatedPriceShown: "Gösterilen tahmini fiyat",
    },
  },
} as const;

export function getPublicCopy(locale: PublicLocale) {
  return publicCopy[locale];
}

export function getIntentLabel(value: IntentValue, locale: PublicLocale) {
  return pick(intentLabels[value], locale);
}

export function getSizeLabel(value: SizeValue, locale: PublicLocale) {
  return pick(sizeLabels[value], locale);
}

export function getStyleLabel(value: StyleValue, locale: PublicLocale) {
  return styleLabels[value] ? pick(styleLabels[value], locale) : value;
}

export function getFeaturedCategoryLabel(value: FeaturedCategoryValue, locale: PublicLocale) {
  return pick(featuredCategoryLabels[value], locale);
}

export function getPlacementDetailLocaleLabel(
  value: BodyAreaDetailValue | string,
  locale: PublicLocale,
) {
  const key = value as BodyAreaDetailValue;
  return placementDetailLabels[key] ? pick(placementDetailLabels[key], locale) : value;
}

export function getPlacementCategoryLocaleLabel(value: PlacementCategoryValue, locale: PublicLocale) {
  return pick(placementCategoryLabels[value], locale);
}

export function getPlacementCategoryDescription(value: PlacementCategoryValue, locale: PublicLocale) {
  return pick(placementCategoryDescriptions[value], locale);
}
