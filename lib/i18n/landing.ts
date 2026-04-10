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
    badge: "Mobile-first lead funnel for tattoo artists",
    title: "Turn your Instagram bio into a premium tattoo inquiry flow.",
    description:
      "Tattix gives each artist a polished public page, a guided client intake, a rule-based price estimate, and a WhatsApp-ready handoff.",
    primaryCta: "Create your artist page",
    secondaryCta: "View demo artist page",
    outcomes: [
      "Public artist page at /artist-slug",
      "Dashboard for profile, pricing, featured designs, and leads",
      "Supabase-backed auth, database schema, and demo seed data",
    ],
    previewBadge: "Live funnel preview",
    previewSteps: "6 steps",
    previewArtist: "Ink Atelier Demo",
    previewTitle: "Tell us the placement, size, and style in a few quick steps.",
    previewOptions: ["Flash design", "Custom tattoo", "I have a design in mind"],
    pillars: [
      {
        title: "Guided client intake",
        description:
          "Lead clients from Instagram bio into a clean mobile flow instead of messy DMs.",
      },
      {
        title: "Rule-based estimates",
        description:
          "Use artist-owned pricing logic for size, style, placement, and design intent.",
      },
      {
        title: "Clean handoff",
        description:
          "Deliver a WhatsApp-ready message or copy the brief for Instagram DM follow-up.",
      },
    ],
    whyEyebrow: "Why artists use Tattix",
    whyTitle: "A cleaner front door for tattoo bookings.",
    whyDescription:
      "Built for mobile bio traffic first, with a premium dark studio feel that still stays practical for real lead handling.",
  },
} as const;
