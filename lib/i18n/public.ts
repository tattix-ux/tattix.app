import type {
  BodyAreaDetailValue,
  PlacementCategoryValue,
} from "@/lib/constants/body-placement";
import type { IntentValue, SizeValue, StyleValue } from "@/lib/constants/options";

export type PublicLocale = "en" | "tr";

type LocalizedText = Record<PublicLocale, string>;

function pick(text: LocalizedText, locale: PublicLocale) {
  return text[locale];
}

const intentLabels: Record<IntentValue, LocalizedText> = {
  "custom-tattoo": { en: "I have an idea", tr: "Bir fikrim var" },
  "design-in-mind": { en: "I have an idea", tr: "Bir fikrim var" },
  "flash-design": { en: "I want to choose a ready-made design", tr: "Hazır tasarım seçmek istiyorum" },
  "discounted-design": { en: "I want to choose a ready-made design", tr: "Hazır tasarım seçmek istiyorum" },
  "not-sure": { en: "I'm undecided", tr: "Kararsızım" },
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
  realism: { en: "Realistic", tr: "Realistic" },
  "micro-realism": { en: "Micro realism", tr: "Micro realism" },
  ornamental: { en: "Ornamental", tr: "Ornamental" },
  lettering: { en: "Lettering", tr: "Yazı" },
  "not-sure-style": { en: "I'm not sure", tr: "Emin değilim" },
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

const featuredCategoryLabels: Record<string, LocalizedText> = {
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
  "placement-not-sure": { en: "I'm not sure", tr: "Emin değilim" },
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
  "not-sure": { en: "I'm not sure", tr: "Emin değilim" },
};

const placementCategoryDescriptions: Record<PlacementCategoryValue, LocalizedText> = {
  arm: { en: "Upper arm, lower arm, or wrist", tr: "Üst kol, alt kol veya bilek" },
  leg: { en: "Upper leg, lower leg, ankle, or foot", tr: "Üst bacak, alt bacak, ayak bileği veya ayak" },
  torso: { en: "Chest, ribs, or stomach", tr: "Göğüs, kaburga veya karın" },
  back: { en: "Upper back, lower back, or spine", tr: "Üst sırt, alt sırt veya omurga" },
  neck: { en: "Front, side, or back of neck", tr: "Boynun ön, yan veya arka kısmı" },
  head: { en: "Head-focused placement", tr: "Baş bölgesi" },
  hand: { en: "Hand or fingers", tr: "El veya parmaklar" },
  foot: { en: "Foot or toes", tr: "Ayak veya ayak parmakları" },
  "not-sure": { en: "You can keep browsing even if placement is not clear yet", tr: "Emin değilsen yine de devam edebilirsin" },
};

export const publicCopy = {
  en: {
    language: "Language",
    stepLabel: "Step",
    stepTitles: [
      "What feels closest to what you want?",
      "Where would you like it?",
      "How big should it be?",
      "Details that affect the quote",
      "Anything else you want to add?",
      "Your estimate",
    ],
    stepDescriptions: [
      "Pick the closest option. You can keep going even if you're not fully sure.",
      "Choose the general area first, then the exact spot.",
      "Choose the approximate size in cm.",
      "Choose the detail level, color, and style.",
      "Add a short note if you want, then choose your city and timing.",
      "",
    ],
    featuredEyebrow: "Featured collections",
    featuredTitle: "Artist designs available for this request",
    placementCategoryLabel: "Placement group",
    placementCategoryHelp: "Choose the general area first.",
    placementDetailLabel: "Placement detail",
    placementDetailHelpPrefix: "Choose the exact spot inside",
    placementSummaryLabel: "Selected area",
    placementSummaryEmpty: "No area selected yet",
    currentPlacement: "Current placement",
    noPlacementSelected: "No placement selected yet",
    currentPlacementHelp: "Changing the parent group resets the child placement automatically.",
    selectPlacementFirst: "Choose an area first",
    selectPlacementHelp: "Pick an area to keep going.",
    approximateTattooSize: "Tattoo size",
    adjustSliderFor: "Choose the approximate size for",
    approxSize: "Selected size",
    sizeNotSelected: "Not selected",
    currentRange: "Typical range",
    minimumLabel: "Minimum",
    maximumLabel: "Maximum",
    sizeImpactNote: "This choice affects the estimated price range.",
    approximateTime: "Approximate time",
    notesPlaceholder: "Add a short note if you want. For example: sensitivity, idea, or special request.",
    notesHelper: "",
    contextTitle: "Extra context",
    contextHelp: "This does not always change the price, but it helps the artist understand the request better.",
    customerDetailsTitle: "A few optional details",
    customerDetailsHelp: "You can leave these blank if you want.",
    genderLabel: "Gender",
    genderPlaceholder: "Select if you want",
    ageRangeLabel: "Age range",
    ageRangePlaceholder: "Select if you want",
    genders: {
      female: "Female",
      male: "Male",
      prefer_not_to_say: "Prefer not to say",
    },
    ageRanges: {
      "18-24": "18-24",
      "25-34": "25-34",
      "35-44": "35-44",
      "45+": "45+",
    },
    cityLabel: "Which city do you want to book in?",
    cityHelp: "Choose one of the cities where the artist is available.",
    cityPlaceholder: "Select city",
    preferredTimingLabel: "Choose when you're available",
    preferredTimingHelp: "You can choose a date or a date range based on the artist's calendar.",
    preferredStartDate: "Available appointment date",
    preferredEndDate: "Range end date",
    preferredRangeLabel: "Available date range",
    preferredRangePlaceholder: "Choose a date range",
    preferredRangeHelp: "If you don't know the exact day yet, you can choose an approximate range.",
    timingModeSingle: "Single day",
    timingModeRange: "Date range",
    noAvailableDates: "There is no selectable appointment date for this city right now.",
    estimatedRange: "Estimated range",
    sendWhatsapp: "Send via WhatsApp",
    copyMessage: "Copy message",
    copiedForInstagram: "Copied for Instagram DM",
    back: "Back",
    next: "Next",
    calculating: "Calculating...",
    calculatingTitle: "Calculating your estimate",
    calculatingBody: "This only takes a few seconds.",
    startOver: "Start over",
    defaultPrimaryCta: "See my estimate",
    disclaimer: "This is the average range based on your selections. Final price may change after the details are discussed.",
    scopeWarning:
      "This is an estimated starting range. Final price may change after the design and scope are clarified.",
    coverUpCustomWarning:
      "This is the general price of a design with these features. For cover-ups and custom designs, the final price may change significantly after talking with the artist.",
    chooseDesign: "Choose a design",
    chooseDesignHelp: "Select one uploaded design before you continue.",
    noMatchingDesigns: "No matching designs are live right now.",
    notSureIntentHint: "You can choose a general direction and keep going.",
    referenceUploadLabel: "Reference",
    referenceUploadHelp: "You can add an image that supports the idea in your head.",
    uploadReference: "Upload reference",
    referenceSelected: "Selected reference",
    referenceImageUrl: "Reference image URL",
    referenceDescriptionLabel: "Short description",
    referenceDescriptionPlaceholder: "Describe your idea briefly. For example: a fine-line rose, small and simple.",
    readyMadeDesign: "Selected design",
    styleSkippedNote: "",
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
      simple: "Contains simpler lines and fewer details.",
      standard: "A balanced level that fits most ideas.",
      detailed: "Contains denser lines, texture, or smaller details.",
    },
    colorModeTitle: "How should the color be?",
    colorModeHelp: "",
    colorModes: {
      "black-only": "Black only",
      "black-grey": "Black and grey",
      "full-color": "Color",
    },
    colorModeDescriptions: {
      "black-only": "Only black ink is used.",
      "black-grey": "Black ink with soft grey transitions or shading.",
      "full-color": "Suitable for work that includes more than one color.",
    },
    coverUpTitle: "Is this a cover-up?",
    coverUpHelp: "Cover-ups usually need extra planning and passes.",
    coverUpYes: "Yes, it covers an older tattoo",
    coverUpNo: "No, it will be on clean skin",
    optionalStyleTitle: "How should the style be?",
    optionalStyleHelp: "Pick the closest style from what the artist works in.",
    notSureStyleHint: "You can still continue if you're not fully sure.",
    close: "Close",
    resultSummaryTitle: "Selection summary",
    whatsappHelper: "Your selections are sent to the artist as a message.",
    summaryLabels: {
      intent: "Job type",
      areaScope: "Area",
      areaCoverage: "Coverage",
      wideAreaTarget: "Closest area",
      selectedDesign: "Selected design",
      placement: "Placement",
      size: "Size",
      approximateSize: "Approximate size",
      detail: "Detail",
      color: "Color",
      style: "Character of the piece",
      referenceImage: "Reference image uploaded",
      referenceImageUrl: "Reference image URL",
      referenceDescription: "Reference description",
      city: "City",
      gender: "Gender",
      ageRange: "Age range",
      preferredTiming: "Preferred timing",
      notes: "Notes",
      noNotes: "No note",
      estimatedPriceShown: "Shown price range",
    },
  },
  tr: {
    language: "Dil",
    stepLabel: "Adım",
    stepTitles: [
      "Neye yakın bir şey düşünüyorsun?",
      "Nereye yapılmasını istersin?",
      "Boyutu ne kadar olsun?",
      "Fiyatı etkileyen detaylar",
      "Eklemek istediğin başka bir detay var mı?",
      "Tahminin hazır",
    ],
    stepDescriptions: [
      "Sana en yakın seçeneği işaretle. Tam net olmasa da devam edebilirsin.",
      "Önce genel bölgeyi, sonra tam yeri seç.",
      "Yaklaşık boyutu cm olarak seç.",
      "Detay seviyesi, renk ve tarzını seç.",
      "İstersen kısa bir not ekleyebilir, şehir ve uygun zamanı seçebilirsin.",
      "",
    ],
    featuredEyebrow: "Öne çıkan koleksiyonlar",
    featuredTitle: "Bu talep için uygun tasarımlar",
    placementCategoryLabel: "Yerleşim bölgesi",
    placementCategoryHelp: "Önce genel bölgeyi seç.",
    placementDetailLabel: "Yerleşim detayı",
    placementDetailHelpPrefix: "Seçtiğin bölge içindeki tam yeri işaretle.",
    placementSummaryLabel: "Seçilen bölge",
    placementSummaryEmpty: "Henüz bölge seçilmedi",
    currentPlacement: "Seçili yerleşim",
    noPlacementSelected: "Henüz bir yerleşim seçilmedi",
    currentPlacementHelp: "Tam yerden emin değilsen yine de devam edebilirsin.",
    selectPlacementFirst: "Önce bir bölge seç",
    selectPlacementHelp: "Devam etmek için önce bir bölge seç.",
    approximateTattooSize: "Dövme boyutu",
    adjustSliderFor: "için yaklaşık boyutu seç",
    approxSize: "Seçilen boyut",
    sizeNotSelected: "Belirtilmedi",
    currentRange: "Geçerli aralık",
    minimumLabel: "Minimum",
    maximumLabel: "Maksimum",
    sizeImpactNote: "Bu seçim yaklaşık fiyat aralığını etkiler.",
    approximateTime: "Yaklaşık süre",
    notesPlaceholder: "İstersen kısa bir not ekleyebilirsin. Örn. hassasiyet, fikir, ek istek.",
    notesHelper: "",
    contextTitle: "Ek bağlam",
    contextHelp: "Bu bilgi fiyatı her zaman değiştirmez ama talebin daha doğru anlaşılmasını sağlar.",
    customerDetailsTitle: "Birkaç opsiyonel bilgi",
    customerDetailsHelp: "İstersen boş bırakabilirsin.",
    genderLabel: "Cinsiyet",
    genderPlaceholder: "İstersen seç",
    ageRangeLabel: "Yaş aralığı",
    ageRangePlaceholder: "İstersen seç",
    genders: {
      female: "Kadın",
      male: "Erkek",
      prefer_not_to_say: "Belirtmek istemiyorum",
    },
    ageRanges: {
      "18-24": "18-24",
      "25-34": "25-34",
      "35-44": "35-44",
      "45+": "45+",
    },
    cityLabel: "Randevu almak istediğin şehir",
    cityHelp: "Sanatçının uygun olduğu şehirlerden birini seç.",
    cityPlaceholder: "Şehir seç",
    preferredTimingLabel: "Uygun olduğun zamanı seç",
    preferredTimingHelp: "Sanatçının uygun takvimine göre tarih veya tarih aralığı seçebilirsin.",
    preferredStartDate: "Uygun randevu tarihi",
    preferredEndDate: "Aralığın bitiş tarihi",
    preferredRangeLabel: "Uygun tarih aralığı",
    preferredRangePlaceholder: "Tarih aralığı seç",
    preferredRangeHelp: "Net gün belli değilse yaklaşık aralık seçebilirsin.",
    timingModeSingle: "Tek gün",
    timingModeRange: "Tarih aralığı",
    noAvailableDates: "Bu şehir için şu anda seçilebilir randevu tarihi yok.",
    estimatedRange: "Tahmini fiyat aralığı",
    sendWhatsapp: "WhatsApp ile gönder",
    copyMessage: "Mesajı kopyala",
    copiedForInstagram: "Instagram DM için kopyalandı",
    back: "Geri",
    next: "Devam et",
    calculating: "Hesaplanıyor...",
    calculatingTitle: "Tahminin hazırlanıyor",
    calculatingBody: "Birkaç saniye içinde fiyat aralığın hazır olacak.",
    startOver: "Baştan başla",
    defaultPrimaryCta: "Tahminimi gör",
    disclaimer: "Seçimlerine göre bu işin ortalama fiyat aralığı budur. Net fiyat, detaylar konuşulduktan sonra değişebilir.",
    scopeWarning:
      "Bu sadece başlangıç için tahmini bir aralıktır. Tasarım ve kapsam netleştikçe nihai fiyat değişebilir.",
    coverUpCustomWarning:
      "Bu özelliklerdeki bir tasarımın genel fiyatıdır. Cover-up ve özel tasarımlarda fiyat, sanatçıyla görüştükten sonra büyük ölçüde değişebilir.",
    chooseDesign: "Bir tasarım seç",
    chooseDesignHelp: "Devam etmeden önce yüklenen tasarımlardan birini seç.",
    noMatchingDesigns: "Şu an seçebileceğin hazır bir tasarım bulunmuyor.",
    notSureIntentHint: "Genel bir yön seçip devam edebilirsin.",
    referenceUploadLabel: "Referans",
    referenceUploadHelp: "Aklındaki fikri destekleyecek bir görsel ekleyebilirsin.",
    uploadReference: "Referans yükle",
    referenceSelected: "Seçilen referans",
    referenceImageUrl: "Referans görsel bağlantısı",
    referenceDescriptionLabel: "Kısa açıklama",
    referenceDescriptionPlaceholder: "Fikrini kısaca anlat. Örn. ince çizgi bir gül, küçük ve sade.",
    readyMadeDesign: "Seçilen tasarım",
    styleSkippedNote: "",
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
      simple: "Daha sade çizgiler ve daha az detay içerir.",
      standard: "Çoğu fikir için dengeli bir detay seviyesidir.",
      detailed: "Daha yoğun çizgi, doku veya küçük detaylar içerir.",
    },
    colorModeTitle: "Renk nasıl olsun?",
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
    optionalStyleTitle: "Tarz nasıl olsun?",
    optionalStyleHelp: "Sanatçının çalıştığı tarzlardan sana en yakın olanı seç.",
    notSureStyleHint: "Tam stil bilmiyorsan yine de devam edebilirsin.",
    close: "Kapat",
    resultSummaryTitle: "Seçim özeti",
    whatsappHelper: "Seçimlerin mesaj olarak sanatçıya gönderilir.",
    summaryLabels: {
      intent: "İş tipi",
      areaScope: "Alan",
      areaCoverage: "Kaplayacağı alan",
      wideAreaTarget: "Yakın olduğu alan",
      selectedDesign: "Seçilen tasarım",
      placement: "Yerleşim",
      size: "Boyut",
      approximateSize: "Yaklaşık boyut",
      detail: "Detay",
      color: "Renk",
      style: "İşin karakteri",
      referenceImage: "Referans görsel yüklendi",
      referenceImageUrl: "Referans görsel bağlantısı",
      referenceDescription: "Referans açıklaması",
      city: "Şehir",
      gender: "Cinsiyet",
      ageRange: "Yaş aralığı",
      preferredTiming: "Tercih edilen zaman",
      notes: "Notlar",
      noNotes: "Ek not yok",
      estimatedPriceShown: "Gördüğüm fiyat aralığı",
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

export function getFeaturedCategoryLabel(value: string, locale: PublicLocale) {
  return featuredCategoryLabels[value] ? pick(featuredCategoryLabels[value], locale) : value;
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
