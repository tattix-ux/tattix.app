export type LandingLocale = "tr" | "en";

export const landingCopy = {
  tr: {
    login: "Giriş yap",
    languageLabel: "Dil",
    badge: "Dövme sanatçıları için mobil öncelikli lead akışı",
    title: "Instagram biyonu premium bir dövme talep akışına dönüştür.",
    description:
      "Tattix her sanatçıya şık bir herkese açık sayfa, yönlendirmeli müşteri akışı, kural bazlı fiyat tahmini ve WhatsApp'a hazır bir devir teslim sunar.",
    primaryCta: "Sanatçı sayfanı oluştur",
    secondaryCta: "Demo sanatçı sayfasını gör",
    outcomes: [
      "Herkese açık sanatçı sayfası: /artist-slug",
      "Profil, fiyatlama, tasarımlar ve talepler için panel",
      "Supabase destekli auth, veritabanı şeması ve demo veri",
    ],
    previewBadge: "Canlı akış önizlemesi",
    previewSteps: "6 adım",
    previewArtist: "Ink Atelier Demo",
    previewTitle: "Yerleşimi, boyutu ve stili birkaç adımda paylaş.",
    previewOptions: ["Flash tasarım", "Özel dövme", "Aklımda bir tasarım var"],
    pillars: [
      {
        title: "Yönlendirmeli müşteri akışı",
        description:
          "Müşterileri dağınık DM trafiği yerine Instagram biyonundan temiz bir mobil akışa al.",
      },
      {
        title: "Kural bazlı tahminler",
        description:
          "Boyut, stil, yerleşim ve talep türüne göre sanatçıya ait fiyat mantığını kullan.",
      },
      {
        title: "Temiz devir teslim",
        description:
          "WhatsApp'a hazır mesaj üret ya da brief'i Instagram DM için kolayca kopyala.",
      },
    ],
    whyEyebrow: "Sanatçılar neden Tattix kullanıyor?",
    whyTitle: "Dövme rezervasyonları için daha temiz bir giriş noktası.",
    whyDescription:
      "En baştan mobil bio trafiği için tasarlandı; premium stüdyo hissini korurken günlük lead yönetiminde de pratik kalır.",
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
