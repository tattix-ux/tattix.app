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
  "not-sure-style": { en: "I'm not sure", tr: "Henüz emin değilim" },
  custom: { en: "Custom", tr: "Özel" },
};

const styleDescriptions: Record<string, LocalizedText> = {
  "fine-line": {
    en: "Thin, delicate lines with minimal shading and a light overall feel.",
    tr: "İnce, zarif çizgiler ve minimum gölgelendirme ile hafif bir görünüm sunar.",
  },
  minimal: {
    en: "Clean, simple compositions with very little visual noise.",
    tr: "Temiz, sade ve gereksiz detaydan uzak kompozisyonlara odaklanır.",
  },
  traditional: {
    en: "Bold outlines, classic tattoo shapes, and a timeless old-school feel.",
    tr: "Kalın konturlar, klasik formlar ve zamansız bir old-school hissi taşır.",
  },
  "neo-traditional": {
    en: "A richer version of traditional tattooing with more detail and flow.",
    tr: "Traditional yaklaşımın daha detaylı, daha akışkan ve daha zengin bir versiyonudur.",
  },
  blackwork: {
    en: "Bold black ink, strong contrast, and a graphic high-impact look.",
    tr: "Yoğun siyah mürekkep, yüksek kontrast ve güçlü bir grafik etki sunar.",
  },
  realism: {
    en: "Shaded work focused on lifelike depth, texture, and realistic detail.",
    tr: "Gerçekçi derinlik, doku ve detay hissine odaklanan gölgeli bir tarzdır.",
  },
  "micro-realism": {
    en: "Very small tattoos with realistic detail packed into a compact area.",
    tr: "Küçük alanda gerçekçi detay taşıyan çok küçük dövmeler için uygundur.",
  },
  ornamental: {
    en: "Decorative shapes, symmetry, and elegant flow inspired by ornament.",
    tr: "Süsleme etkisi taşıyan dekoratif formlar, simetri ve zarif akış üzerine kuruludur.",
  },
  lettering: {
    en: "Words, initials, or phrases where typography and spacing matter most.",
    tr: "Kelime, harf veya cümlelerde tipografi ve boşluk kullanımının öne çıktığı stildir.",
  },
  "not-sure-style": {
    en: "You can keep going without locking the style yet. The artist can refine it later.",
    tr: "Stili şimdi netleştirmeden devam edebilirsin. Sanatçı bunu sonradan birlikte netleştirebilir.",
  },
  custom: {
    en: "A flexible direction that lets the artist shape the final style with you.",
    tr: "Sanatçının son stili seninle birlikte şekillendirmesine alan tanıyan esnek bir seçenektir.",
  },
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
  "arm-other": { en: "Other arm area", tr: "Kolun başka bir bölgesi" },
  "leg-other": { en: "Other leg area", tr: "Bacağın başka bir bölgesi" },
  "torso-other": { en: "Other torso area", tr: "Gövdede başka bir bölge" },
  "back-other": { en: "Other back area", tr: "Sırtın başka bir bölgesi" },
  "neck-other": { en: "Other neck area", tr: "Boynun başka bir bölgesi" },
  "head-other": { en: "Other head area", tr: "Başın başka bir bölgesi" },
  "hand-other": { en: "Other hand area", tr: "Elin başka bir bölgesi" },
  "foot-other": { en: "Other foot area", tr: "Ayağın başka bir bölgesi" },
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
      "What affects the quote most?",
      "Anything else to know?",
      "Your estimate",
    ],
    stepDescriptions: [
      "Pick the request type and, if needed, choose a ready-made design.",
      "Choose the placement group and exact area.",
      "Set the tattoo size in centimeters.",
      "Set the detail level and color.",
      "Add any extra context before the estimate is calculated.",
      "We are preparing your tattoo estimate.",
    ],
    featuredEyebrow: "Featured collections",
    featuredTitle: "Artist designs available for this request",
    placementCategoryLabel: "Placement group",
    placementCategoryHelp: "Pick the broad area first. Tapping the same option again clears it.",
    placementDetailLabel: "Placement detail",
    placementDetailHelpPrefix: "Choose the exact placement inside",
    placementSummaryLabel: "Selected area",
    placementSummaryEmpty: "No area selected yet",
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
    notesPlaceholder: "Optional notes, body sensitivities, blood thinners, allergies, or anything the artist should know.",
    notesHelper: "These notes go directly to the artist together with your request.",
    contextTitle: "Extra context",
    contextHelp: "These details do not automatically change the estimate, but they help the artist review the request.",
    cityLabel: "Which city do you want to book in?",
    cityHelp: "Choose one of the cities defined by the artist.",
    cityPlaceholder: "Select city",
    preferredTimingLabel: "Choose an available appointment date",
    preferredTimingHelp: "Only dates opened by the artist are shown here.",
    preferredStartDate: "Available appointment date",
    preferredEndDate: "Available appointment date",
    noAvailableDates: "There is no selectable appointment date for this city right now.",
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
    scopeWarning:
      "This is an estimated starting range. Final price may change after the design and scope are clarified.",
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
    styleInfoButton: "What does this style mean?",
    styleInfoTitle: "Style details",
    detailLevelTitle: "How detailed should it be?",
    detailLevelHelp: "",
    detailLevels: {
      simple: "Low detail",
      standard: "Medium detail",
      detailed: "High detail",
    },
    detailLevelDescriptions: {
      simple: "Simpler lines and fewer small details.",
      standard: "A balanced level that fits most tattoo ideas.",
      detailed: "More texture, finer lines, and a denser look.",
    },
    colorModeTitle: "Color",
    colorModeHelp: "",
    colorModes: {
      "black-only": "Black only",
      "black-grey": "Black and grey",
      "full-color": "Color",
    },
    colorModeDescriptions: {
      "black-only": "Only black ink, no grey wash or color work.",
      "black-grey": "Black ink with soft grey transitions or shading.",
      "full-color": "Tattoos that include more than one color.",
    },
    coverUpTitle: "Is this a cover-up?",
    coverUpHelp: "Cover-ups usually need extra planning and passes.",
    coverUpYes: "Yes, it covers an older tattoo",
    coverUpNo: "No, it will be on clean skin",
    optionalStyleTitle: "Style",
    optionalStyleHelp: "Style stays as context for the artist, but it is no longer the main price driver.",
    close: "Close",
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
      city: "City",
      preferredTiming: "Preferred timing",
      notes: "Notes",
      noNotes: "No additional notes.",
      estimatedPriceShown: "Estimated price shown",
    },
  },
  tr: {
    language: "Dil",
    stepLabel: "Adım",
    stepTitles: [
      "Nasıl bir dövme düşünüyorsun?",
      "Nereye yapılmasını istersin?",
      "Boyutu ne kadar olsun?",
      "Fiyatı en çok etkileyen detaylar neler?",
      "Eklemek istediğin başka bir detay var mı?",
      "Tahminin hazır",
    ],
    stepDescriptions: [
      "Talep türünü seç. Uygunsa hazır bir tasarım da seçebilirsin.",
      "Önce ana bölgeyi, ardından tam yerleşimi seç.",
      "Dövme boyutunu santimetre cinsinden ayarla.",
      "Detay seviyesini ve rengi seç.",
      "Tahminden önce paylaşmak istediğin ek bilgileri ekleyebilirsin.",
      "Dövme tahminin hazırlanıyor.",
    ],
    featuredEyebrow: "Öne çıkan koleksiyonlar",
    featuredTitle: "Bu talep için uygun tasarımlar",
    placementCategoryLabel: "Yerleşim bölgesi",
    placementCategoryHelp: "Önce genel bölgeyi seç. Aynı seçeneğe tekrar dokunursan seçim kaldırılır.",
    placementDetailLabel: "Yerleşim detayı",
    placementDetailHelpPrefix: "Bu alan içindeki tam bölgeyi seç:",
    placementSummaryLabel: "Seçilen bölge",
    placementSummaryEmpty: "Henüz bölge seçilmedi",
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
    notesPlaceholder: "İsteğe bağlı notlar, alerji, kan sulandırıcı ilaç kullanımı veya diğer sağlık durumları gibi bilgileri buraya yazabilirsin.",
    notesHelper: "Bu notlar talebinle birlikte doğrudan sanatçıya iletilir.",
    contextTitle: "Ek bağlam",
    contextHelp: "Bu detaylar tahmini otomatik olarak değiştirmez, ama sanatçının talebi doğru değerlendirmesine yardımcı olur.",
    cityLabel: "Hangi şehirde randevu almak istiyorsun?",
    cityHelp: "Sanatçının çalıştığı şehirlerden birini seç.",
    cityPlaceholder: "Şehir seç",
    preferredTimingLabel: "Uygun randevu tarihi seç",
    preferredTimingHelp: "Burada sadece sanatçının açtığı tarihler görünür.",
    preferredStartDate: "Uygun randevu tarihi",
    preferredEndDate: "Uygun randevu tarihi",
    noAvailableDates: "Bu şehir için şu anda seçilebilir randevu tarihi yok.",
    estimatedRange: "Tahmini fiyat aralığı",
    sendWhatsapp: "WhatsApp ile gönder",
    copyMessage: "Mesajı kopyala",
    copiedForInstagram: "Instagram DM için kopyalandı",
    back: "Geri",
    next: "Devam et",
    calculating: "Hesaplanıyor...",
    calculatingTitle: "Tahminin hazırlanıyor",
    calculatingBody: "Yerleşim, boyut ve fiyat kuralları değerlendirilerek tahmini aralık hazırlanıyor.",
    startOver: "Baştan başla",
    defaultPrimaryCta: "Tahminimi gör",
    disclaimer: "Bu yaklaşık bir tahmindir. Nihai fiyat görüşmeden sonra değişebilir.",
    scopeWarning:
      "Bu sadece başlangıç için tahmini bir aralıktır. Tasarım ve kapsam netleştikçe nihai fiyat değişebilir.",
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
    viewDesignDetails: "Detayları incele",
    selectThisDesign: "Bu tasarımı seç",
    unselectDesign: "Tasarımı kaldır",
    styleInfoButton: "Bu stil ne anlama geliyor?",
    styleInfoTitle: "Stil detayı",
    detailLevelTitle: "Detay seviyesi nasıl olsun?",
    detailLevelHelp: "",
    detailLevels: {
      simple: "Az detay",
      standard: "Orta detay",
      detailed: "Çok detay",
    },
    detailLevelDescriptions: {
      simple: "Daha sade çizgiler ve daha az küçük detay içerir.",
      standard: "Çoğu dövme fikri için dengeli bir detay seviyesidir.",
      detailed: "Daha fazla doku, daha ince çizgi ve yoğun detay içerir.",
    },
    colorModeTitle: "Renk",
    colorModeHelp: "",
    colorModes: {
      "black-only": "Sadece siyah",
      "black-grey": "Siyah-gri",
      "full-color": "Renkli",
    },
    colorModeDescriptions: {
      "black-only": "Yalnızca siyah mürekkep kullanılır.",
      "black-grey": "Siyah mürekkep ve gri geçişler kullanılır.",
      "full-color": "Birden fazla renk içeren dövmeler için uygundur.",
    },
    coverUpTitle: "Bu bir kapatma işi mi?",
    coverUpHelp: "Kapatma işleri genelde ekstra planlama ve daha fazla çalışma ister.",
    coverUpYes: "Evet, eski bir dövmenin üstü kapanacak",
    coverUpNo: "Hayır, temiz cilde uygulanacak",
    optionalStyleTitle: "Stil",
    optionalStyleHelp: "Stil hâlâ sanatçı için faydalı bir bağlamdır, ama artık fiyatın ana belirleyicisi değildir.",
    close: "Kapat",
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
      city: "Şehir",
      preferredTiming: "Tercih edilen zaman",
      notes: "Notlar",
      noNotes: "Ek not bırakılmadı.",
      estimatedPriceShown: "Paylaşılan tahmini fiyat",
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

export function getStyleDescription(value: StyleValue, locale: PublicLocale) {
  return styleDescriptions[value] ? pick(styleDescriptions[value], locale) : null;
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
