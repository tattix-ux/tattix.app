export type LandingLocale = "tr" | "en";

export const landingCopy = {
  tr: {
    login: "Giriş yap",
    languageLabel: "Dil",
    badge: "Dövme sanatçıları için mobil öncelikli talep akışı",
    title: "Instagram’dan gelen talepleri düzenli ve yönetilebilir bir akışa dönüştür.",
    description:
      "Tattix, dövme sanatçıları için tasarlanmış yönlendirmeli talep akışı, kural bazlı fiyat tahmini ve WhatsApp’a hazır müşteri devri sunar.",
    primaryCta: "Sanatçı sayfanı oluştur",
    secondaryCta: "Canlı demoyu incele",
    outcomes: [
      "Herkese açık sanatçı sayfası",
      "Talep, tasarım ve fiyatlama için tek panel",
      "Hazır veri yapısı ve hızlı kurulum",
    ],
    previewBadge: "Canlı akış önizlemesi",
    previewSteps: "6 adım",
    previewArtist: "Ink Atelier Demo",
    previewTitle: "Yerleşimi, boyutu ve stili birkaç adımda paylaş.",
    previewOptions: ["Flash tasarım", "Özel dövme", "Aklımda bir tasarım var"],
    pillars: [
      {
        title: "Yönlendirilmiş talep akışı",
        description:
          "Müşteriyi adım adım yönlendirerek eksiksiz ve net talepler oluştur.",
      },
      {
        title: "Kural bazlı fiyat tahmini",
        description:
          "Boyut, stil ve yerleşime göre otomatik fiyat aralığı oluştur.",
      },
      {
        title: "Hazır müşteri devri",
        description:
          "Talebi WhatsApp veya Instagram’a tek tıkla ilet.",
      },
    ],
    whyEyebrow: "Sanatçılar neden Tattix kullanıyor?",
    whyTitle: "Daha düzenli talepler, daha net müşteriler.",
    whyDescription:
      "Dağınık DM trafiğini, yönlendirilmiş ve filtrelenmiş bir talep akışına dönüştür.",
  },
  en: {
    login: "Login",
    languageLabel: "Language",
    badge: "Mobile-first inquiry flow for tattoo artists",
    title: "Turn Instagram inquiries into an organized, manageable flow.",
    description:
      "Tattix gives tattoo artists a guided inquiry flow, rule-based price estimation, and a WhatsApp-ready client handoff.",
    primaryCta: "Create your artist page",
    secondaryCta: "Explore the live demo",
    outcomes: [
      "Public artist page",
      "One dashboard for inquiries, designs, and pricing",
      "Ready-made data structure and fast setup",
    ],
    previewBadge: "Live funnel preview",
    previewSteps: "6 steps",
    previewArtist: "Ink Atelier Demo",
    previewTitle: "Tell us the placement, size, and style in a few quick steps.",
    previewOptions: ["Flash design", "Custom tattoo", "I have a design in mind"],
    pillars: [
      {
        title: "Guided inquiry flow",
        description:
          "Guide clients step by step to collect clear, complete tattoo requests.",
      },
      {
        title: "Rule-based price estimation",
        description:
          "Generate an automatic price range based on size, style, and placement.",
      },
      {
        title: "Ready client handoff",
        description:
          "Send the request to WhatsApp or Instagram in a single tap.",
      },
    ],
    whyEyebrow: "Why artists use Tattix",
    whyTitle: "Cleaner inquiries, clearer clients.",
    whyDescription:
      "Turn messy DM traffic into a guided, filtered inquiry flow.",
  },
} as const;
