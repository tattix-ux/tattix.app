export type LandingLocale = "tr" | "en";

export const landingCopy = {
  tr: {
    login: "Giriş yap",
    languageLabel: "Dil",
    badge: "Dövme sanatçıları için yapılandırılmış talep akışı",
    heroTitle: "Instagram DM’lerinden sadece ciddi dövme müşterilerini filtrele.",
    heroDescription:
      "Instagram biyonu, müşteriler sana ulaşmadan önce onları filtreleyen bir başvuru sistemine dönüştür.",
    primaryCta: "Sanatçı sayfanı oluştur",
    secondaryCta: "Demoyu gör",
    ctaNote: "Ücretsiz başla — kredi kartı gerekmez",
    previewBadge: "Müşteriler sana ulaşmadan önce her şeyi doldurur",
    previewNameLabel: "İsim",
    previewRequestLabel: "Dövme talebi",
    previewBudgetLabel: "Bütçe",
    previewPlacementLabel: "Bölge",
    previewValues: {
      name: "Ece K.",
      request: "Fine line kol dövmesi",
      budget: "₺4.000 - ₺6.000",
      placement: "İç kol",
    },
    problemTitle: "Instagram DM’leri dağınık. Dövme işi öyle olmamalı.",
    problemDescription:
      "Çoğu mesaj eksik, belirsiz veya ciddi değil. Aynı soruları tekrar tekrar sormak zorunda kalıyorsun.",
    featuresTitle: "TatBot neyi düzeltir?",
    features: [
      {
        title: "Eksiksiz başvurular al",
        description:
          "Müşteriler ölçü, bölge, referans ve detayları baştan girer. Bilgi peşinde koşmazsın.",
      },
      {
        title: "Fiyat ve niyete göre filtrele",
        description:
          "Minimum bütçe belirle ve düşük kaliteli talepleri otomatik ele.",
      },
      {
        title: "Sadece uygun müşterilerle konuş",
        description: "Sadece süreci tamamlayan kişiler sana ulaşır.",
      },
    ],
    positioningTitle: "Bu sistem müşteri bulmak için değil.",
    positioningSubtitle: "Zaten gelen müşterileri filtrelemek için.",
    positioningBullets: [
      "DM’lerde daha az zaman kaybı",
      "Daha hazırlıklı müşteriler",
      "İş akışında daha fazla kontrol",
    ],
    stepsTitle: "Nasıl çalışır",
    steps: [
      "TatBot linkini Instagram biyona ekle",
      "Müşteriler yapılandırılmış formu doldurur",
      "Sadece uygun müşteriler sana ulaşır",
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
    previewValues: {
      name: "Ece K.",
      request: "Fine line arm piece",
      budget: "$120 - $180",
      placement: "Inner arm",
    },
    problemTitle: "Instagram DMs are messy. Tattoo work shouldn’t be.",
    problemDescription:
      "Most messages are incomplete, unclear, or not serious. You waste time asking the same questions again and again.",
    featuresTitle: "What TatBot fixes",
    features: [
      {
        title: "Get complete requests",
        description:
          "Clients provide size, placement, references, and details upfront. No more chasing information.",
      },
      {
        title: "Filter by price and intent",
        description:
          "Set minimum budgets and avoid low-quality inquiries automatically.",
      },
      {
        title: "Talk only to qualified clients",
        description: "Only users who complete the flow reach your WhatsApp or DM.",
      },
    ],
    positioningTitle: "This is not for getting more clients.",
    positioningSubtitle: "This is for filtering the ones you already get.",
    positioningBullets: [
      "Less time wasted on DMs",
      "Better prepared clients",
      "More control over your workflow",
    ],
    stepsTitle: "How it works",
    steps: [
      "Add your TatBot link to your Instagram bio",
      "Clients fill a structured tattoo request form",
      "Only qualified clients reach you",
    ],
    finalTitle: "Start filtering your clients today",
    finalSubtitle: "Set up your page in minutes",
    finalCta: "Create your artist page",
  },
} as const;
