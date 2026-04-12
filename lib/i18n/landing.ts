export type LandingLocale = "tr" | "en";

export const landingCopy = {
  tr: {
    login: "Giriş yap",
    languageLabel: "Dil",
    badge: "Dövme sanatçıları için yapılandırılmış talep akışı",
    heroTitle: "Instagram DM’lerinden sadece ciddi dövme müşterilerini filtrele.",
    heroDescription:
      "Müşteri sana yazmadan önce bölge, fiyat ve tasarım detayı netleşsin.",
    primaryCta: "Sanatçı sayfanı oluştur",
    secondaryCta: "Demoyu gör",
    ctaNote: "Ücretsiz başla",
    previewBadge: "Sana ulaşmadan önce gerekli bilgileri girerler",
    previewRequestLabel: "Talep türü",
    previewBudgetLabel: "Bütçe",
    previewPlacementLabel: "Bölge",
    previewReferenceLabel: "Tasarım detayı",
    previewValues: {
      request: "Özel dövme",
      budget: "₺4.000 - ₺6.000",
      placement: "İç kol",
      reference: "İnce çizgili çiçek kompozisyonu",
    },
    problemTitle: "Dövme talepleri çoğu zaman eksik ve dağınık geliyor.",
    problemDescription:
      "Kimisi fiyat yazmıyor, kimisi bölgeyi belirtmiyor, kimisi ne istediğini düzgün anlatmıyor. Aynı şeyleri tekrar tekrar sormak zorunda kalıyorsun.",
    featuresTitle: "TatBot neyi düzeltir?",
    features: [
      {
        title: "Eksiksiz başvurular al",
        description:
          "Müşteriler ölçü, bölge, referans ve detayları baştan girsin. Bilgi peşinde koşma!",
      },
      {
        title: "Bütçesi uymayanları baştan ele",
        description:
          "Sanatının fiyatını belirle, sana uymayan talepler ile vakit kaybetme!",
      },
      {
        title: "Daha net müşterilere odaklan",
        description:
          "Süreci tamamlayan, gerçekten satışa dönme potansiyeli olan kişiler sana ulaşsın.",
      },
    ],
    positioningTitle: "Önemli olan daha çok mesaj değil, daha doğru talepler.",
    positioningSubtitle: "Sana gelen talepleri daha düzenli ve yönetilebilir hale getirir.",
    positioningBullets: [
      "DM’lerde daha az zaman kaybı",
      "Daha hazırlıklı müşteriler",
      "İş akışında daha fazla kontrol",
    ],
    stepsTitle: "Nasıl çalışır",
    steps: [
      "Linkini Instagram bio’na ekle",
      "Müşteri talebini birkaç adımda doldursun",
      "Sana daha net ve uygun talepler gelsin",
    ],
    finalTitle: "Bugün müşterilerini filtrelemeye başla",
    finalSubtitle: "Dakikalar içinde kurulum yap",
    finalCta: "Sanatçı sayfanı oluştur",
  },
  en: {
    login: "Login",
    languageLabel: "Language",
    badge: "Structured inquiry flow for tattoo artists",
    heroTitle: "Filter serious tattoo clients from your Instagram DMs.",
    heroDescription:
      "Turn your bio into a structured inquiry flow that qualifies clients before they reach you.",
    primaryCta: "Create your artist page",
    secondaryCta: "View demo",
    ctaNote: "Free to start — no credit card",
    previewBadge: "Clients answer everything before contacting you",
    previewNameLabel: "Name",
    previewRequestLabel: "Tattoo request",
    previewBudgetLabel: "Budget",
    previewPlacementLabel: "Placement",
    previewReferenceLabel: "Design detail",
    previewValues: {
      request: "Custom tattoo",
      budget: "$120 - $180",
      placement: "Inner arm",
      reference: "Fine line floral composition",
    },
    problemTitle: "Tattoo inquiries usually arrive incomplete and messy.",
    problemDescription:
      "Some do not mention budget, some skip placement, and some cannot explain what they want clearly. You end up asking the same things again and again.",
    featuresTitle: "What TatBot fixes",
    features: [
      {
        title: "Get complete requests",
        description:
          "Let clients submit size, placement, references, and details upfront. Stop chasing basic information.",
      },
      {
        title: "Filter out mismatched budgets early",
        description:
          "Set your pricing and stop wasting time on requests that do not fit your work.",
      },
      {
        title: "Focus on clearer clients",
        description:
          "Let people who complete the flow and have real sales potential be the ones who reach you.",
      },
    ],
    positioningTitle: "More messages are not the goal. Better inquiries are.",
    positioningSubtitle: "TatBot makes incoming requests more structured and easier to manage.",
    positioningBullets: [
      "Less time wasted on DMs",
      "Better prepared clients",
      "More control over your workflow",
    ],
    stepsTitle: "How it works",
    steps: [
      "Add your link to your Instagram bio",
      "Let clients complete the request in a few quick steps",
      "Receive clearer and better matched inquiries",
    ],
    finalTitle: "Start filtering your clients today",
    finalSubtitle: "Set up your page in minutes",
    finalCta: "Create your artist page",
  },
} as const;
