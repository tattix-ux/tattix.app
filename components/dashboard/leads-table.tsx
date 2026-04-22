"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronRight, X } from "lucide-react";

import { BrandMonogram } from "@/components/shared/logo";
import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { bodyPlacementGroups, getPlacementDetailLabel } from "@/lib/constants/body-placement";
import { formatApproximateSizeLabel } from "@/lib/constants/size-estimation";
import { intentOptions } from "@/lib/constants/options";
import type { PublicLocale } from "@/lib/i18n/public";
import {
  getAreaScopeLabel,
  getLargeAreaCoverageLabel,
  getRequestTypeLabel,
  getWideAreaTargetLabel,
} from "@/lib/pricing/v2/output";
import type { ArtistFeaturedDesign, ClientSubmission, LeadStatus } from "@/lib/types";
import { cn, formatCompactCurrencyRange, notesPreview } from "@/lib/utils";

type LeadSort =
  | "newest"
  | "oldest"
  | "highest-estimate"
  | "lowest-estimate"
  | "new-first"
  | "contacted-first"
  | "sold-first"
  | "lost-first";

const leadCopy = {
  en: {
    title: "Lead management",
    description: "Review incoming requests and track their status.",
    note: "Note: clients start the conversation. Update the status after they reach out.",
    empty: "No requests yet.",
    emptyDescription: "Share your link to start collecting requests.",
    summary: {
      waiting: "Contacted",
      total: "Total requests",
      sold: "Sold",
      rate: "Sale rate",
    },
    filters: {
      newFirst: "Waiting first",
      contactedFirst: "Contacted first",
      soldFirst: "Sold first",
      lostFirst: "Lost first",
      newest: "Newest",
      oldest: "Oldest",
      highestEstimate: "Highest estimate",
      lowestEstimate: "Lowest estimate",
      sort: "Sort",
    },
    statusLabels: {
      all: "All",
      new: "Waiting for contact",
      contacted: "Contacted",
      sold: "Sold",
      lost: "Lost",
    },
    table: {
      estimate: "Estimate",
      request: "Request",
      details: "Details",
      status: "Status",
      actions: "Status tracking",
      detailButton: "Details",
      color: "Color",
      detailLevel: "Detail level",
      layout: "Placement style",
      styleNote: "Style note",
      area: "Area",
      coverage: "Coverage",
      placement: "Placement",
      size: "Size",
      intent: "Request type",
      coverUp: "Cover-up",
      city: "City",
      timing: "Preferred time",
      notes: "Notes",
      reference: "Reference image",
      shownEstimate: "Estimate shown",
      selectedDesign: "Selected design",
      noCity: "Not shared",
      noTiming: "Not shared",
      noNotes: "No notes",
      noReference: "No reference image",
      noDesign: "No design selected",
      soldAt: "Sale date",
      createdAt: "Created at",
      updatedAt: "Last update",
      pageSummary: (current: number, total: number) => `Page ${current} / ${total}`,
      previous: "Previous",
      next: "Next",
      openImage: "Open full image",
    },
  },
  tr: {
    title: "Talep yönetimi",
    description: "Gelen talepleri incele ve durumlarını takip et.",
    note: "Not: Müşteri iletişimi kendisi başlatır. Yazdığında durumu güncelleyebilirsin.",
    empty: "Henüz talep yok.",
    emptyDescription: "Linkini paylaşarak müşteri toplamaya başla.",
    summary: {
      waiting: "İletişime geçilen",
      total: "Toplam talep",
      sold: "Satış yapıldı",
      rate: "Satış oranı",
    },
    filters: {
      newFirst: "İletişim bekleyen önce",
      contactedFirst: "İletişime geçildi önce",
      soldFirst: "Satış yapıldı önce",
      lostFirst: "Satış olmadı önce",
      newest: "En yeni",
      oldest: "En eski",
      highestEstimate: "En yüksek tahmin",
      lowestEstimate: "En düşük tahmin",
      sort: "Sıralama",
    },
    statusLabels: {
      all: "Tümü",
      new: "İletişim bekleniyor",
      contacted: "İletişime geçildi",
      sold: "Satış yapıldı",
      lost: "Satış olmadı",
    },
    table: {
      estimate: "Tahmin",
      request: "Talep",
      details: "Detaylar",
      status: "Durum",
      actions: "Durum takibi",
      detailButton: "Detay",
      color: "Renk",
      detailLevel: "Detay seviyesi",
      layout: "Yerleşim tarzı",
      styleNote: "Tarz notu",
      area: "Alan",
      coverage: "Kaplayacağı alan",
      placement: "Yerleşim",
      size: "Yaklaşık boyut",
      intent: "Talep tipi",
      coverUp: "Kapatma durumu",
      city: "Şehir",
      timing: "Tercih edilen zaman",
      notes: "Notlar",
      reference: "Referans görsel",
      shownEstimate: "Müşteriye gösterilen tahmin",
      selectedDesign: "Seçilen tasarım",
      noCity: "Paylaşılmadı",
      noTiming: "Paylaşılmadı",
      noNotes: "Not yok",
      noReference: "Referans görsel yok",
      noDesign: "Hazır tasarım seçilmedi",
      soldAt: "Satış tarihi",
      createdAt: "Oluşturulma zamanı",
      updatedAt: "Son güncelleme",
      pageSummary: (current: number, total: number) => `${current} / ${total}. sayfa`,
      previous: "Önceki",
      next: "Sonraki",
      openImage: "Görseli aç",
    },
  },
} as const;

const intentLabelsTr: Record<ClientSubmission["intent"], string> = {
  "custom-tattoo": "Özel dövme",
  "design-in-mind": "Aklımda bir tasarım var",
  "flash-design": "Flash tasarım",
  "discounted-design": "İndirimli tasarım",
  "not-sure": "Emin değilim",
};

const sizeLabels = {
  tr: {
    tiny: "Çok küçük",
    small: "Küçük",
    medium: "Orta",
    large: "Büyük",
  },
  en: {
    tiny: "Tiny",
    small: "Small",
    medium: "Medium",
    large: "Large",
  },
} as const;

const placementLabelsTr = Object.fromEntries(
  bodyPlacementGroups.flatMap((group) =>
    group.details.map((detail) => [
      detail.value,
      ({
        "upper-arm-outer": "Üst kol",
        "forearm-outer": "Ön kol",
        wrist: "Bilek",
        hand: "El",
        "arm-other": "Diğer",
        "thigh-front": "Üst bacak",
        calf: "Alt bacak",
        ankle: "Ayak bileği",
        foot: "Ayak",
        "leg-other": "Diğer",
        "chest-center": "Göğüs",
        ribs: "Kaburga",
        stomach: "Karın",
        "torso-other": "Diğer",
        "upper-back": "Sırt üst",
        "lower-back": "Sırt alt",
        "spine-area": "Omurga",
        "back-other": "Diğer",
        "neck-side": "Boyun yanı",
        "neck-front": "Boyun önü",
        "neck-back": "Boyun arkası",
        "neck-other": "Diğer",
        head: "Baş",
        "head-other": "Diğer",
        fingers: "Parmaklar",
        "hand-other": "Diğer",
        toes: "Ayak parmakları",
        "foot-other": "Diğer",
        "placement-not-sure": "Emin değilim",
      } as Record<string, string>)[detail.value] ?? detail.label,
    ]),
  ),
);

function formatIntent(intent: ClientSubmission["intent"], locale: PublicLocale) {
  if (locale === "tr") {
    return intentLabelsTr[intent] ?? intent;
  }

  return intentOptions.find((item) => item.value === intent)?.label ?? intent;
}

function getCoverUpLabel(value: ClientSubmission["coverUp"], locale: PublicLocale) {
  if (value === null || value === undefined) {
    return null;
  }

  if (locale === "tr") {
    return value ? "Evet" : "Hayır";
  }

  return value ? "Yes" : "No";
}

function formatPlacement(detail: ClientSubmission["bodyAreaDetail"], locale: PublicLocale) {
  if (locale === "tr") {
    return placementLabelsTr[detail] ?? getPlacementDetailLabel(detail);
  }

  return getPlacementDetailLabel(detail);
}

function formatLeadDate(value: string, locale: PublicLocale) {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getEstimateCenter(lead: ClientSubmission) {
  return (lead.estimatedMin + lead.estimatedMax) / 2;
}

function getDisplayedColor(lead: ClientSubmission, locale: PublicLocale) {
  if (!lead.colorMode) {
    return null;
  }

  if (locale === "tr") {
    if (lead.colorMode === "black-only") return "Sadece siyah";
    if (lead.colorMode === "black-grey") return "Siyah-gri";
    return "Renkli";
  }

  if (lead.colorMode === "black-only") return "Black only";
  if (lead.colorMode === "black-grey") return "Black and grey";
  return "Color";
}

function getDisplayedDetailLevel(lead: ClientSubmission, locale: PublicLocale) {
  if (!lead.workStyle) {
    return null;
  }

    if (locale === "tr") {
      if (lead.workStyle === "clean_line") {
      return "Daha sade";
      }

    if (lead.workStyle === "shaded_detailed" && lead.realismLevel === "advanced") {
      return "Çok detaylı / gerçekçi";
    }

    if (lead.workStyle === "shaded_detailed") {
      return "Orta detaylı";
    }
  } else {
    if (lead.workStyle === "clean_line") {
      return "Simple / line-based";
    }

    if (lead.workStyle === "shaded_detailed" && lead.realismLevel === "advanced") {
      return "Very detailed / realistic";
    }

    if (lead.workStyle === "shaded_detailed") {
      return "Medium detail";
    }
  }

  return null;
}

function getDisplayedLayout(lead: ClientSubmission, locale: PublicLocale) {
  const layout = lead.layoutStyle ?? (lead.workStyle === "precision_symmetric" ? "precision" : null);

  if (!layout || layout === "unsure") {
    return null;
  }

  if (locale === "tr") {
    return layout === "precision" ? "Düzenli/Simetrik" : "Akışkan";
  }

  return layout === "precision" ? "Geometric / symmetric" : "Flowing";
}

function getLargePlacementBase(detail: ClientSubmission["bodyAreaDetail"], locale: PublicLocale) {
  if (locale === "tr") {
    switch (detail) {
      case "forearm-outer":
        return "Ön kolun";
      case "upper-arm-outer":
        return "Üst kolun";
      case "calf":
        return "Alt bacağın";
      case "thigh-front":
        return "Üst bacağın";
      case "chest-center":
        return "Göğsün";
      case "ribs":
        return "Kaburga bölgenin";
      case "stomach":
        return "Karın bölgenin";
      case "upper-back":
      case "lower-back":
      case "spine-area":
        return "Sırtın";
      default:
        return `${formatPlacement(detail, locale)} bölgesinin`;
    }
  }

  switch (detail) {
    case "forearm-outer":
      return "Most of the forearm";
    case "upper-arm-outer":
      return "Most of the upper arm";
    case "calf":
      return "Most of the calf";
    case "thigh-front":
      return "Most of the thigh";
    case "chest-center":
      return "Most of the chest";
    case "upper-back":
    case "lower-back":
    case "spine-area":
      return "Most of the back";
    default:
      return formatPlacement(detail, locale);
  }
}

function getLargeAreaPlacementSummary(lead: ClientSubmission, locale: PublicLocale) {
  if (!lead.largeAreaCoverage) {
    return formatPlacement(lead.bodyAreaDetail, locale);
  }

  if (locale === "tr") {
    const base = getLargePlacementBase(lead.bodyAreaDetail, locale);

    switch (lead.largeAreaCoverage) {
      case "partial":
        return `${base} bir kısmı`;
      case "mostly":
        return `${base} büyük kısmı`;
      case "almost_full":
        return `${base} neredeyse tamamı`;
    }
  }

  const base = getLargePlacementBase(lead.bodyAreaDetail, locale);

  switch (lead.largeAreaCoverage) {
    case "partial":
      return base.includes("Most of") ? base.replace("Most of", "Part of") : `Part of ${base}`;
    case "mostly":
      return base;
    case "almost_full":
      return base.includes("Most of") ? base.replace("Most of", "Almost all of") : `Almost all of ${base}`;
  }
}

function getWideAreaPlacementSummary(lead: ClientSubmission, locale: PublicLocale) {
  if (!lead.wideAreaTarget) {
    return null;
  }

  if (locale === "tr") {
    switch (lead.wideAreaTarget) {
      case "half_arm":
        return "Yarım kol";
      case "full_arm":
        return "Tüm kol";
      case "wide_chest":
        return "Göğsün büyük kısmı";
      case "wide_back":
        return "Sırtın büyük kısmı";
      case "half_leg":
        return "Bacağın yarısı";
      case "mostly_leg":
        return "Bacağın büyük kısmı";
      case "unsure":
        return "Geniş alan";
    }
  }

  switch (lead.wideAreaTarget) {
    case "half_arm":
      return "Half sleeve";
    case "full_arm":
      return "Full sleeve";
    case "wide_chest":
      return "Large chest area";
    case "wide_back":
      return "Large back area";
    case "half_leg":
      return "Half leg";
    case "mostly_leg":
      return "Most of the leg";
    case "unsure":
      return "Large area";
  }
}

function formatLeadPlacementSummary(lead: ClientSubmission, locale: PublicLocale) {
  if (lead.areaScope === "wide_area") {
    return getWideAreaPlacementSummary(lead, locale) ?? formatPlacement(lead.bodyAreaDetail, locale);
  }

  if (lead.areaScope === "large_single_area") {
    return getLargeAreaPlacementSummary(lead, locale);
  }

  return formatPlacement(lead.bodyAreaDetail, locale);
}

function getSizeLabel(lead: ClientSubmission, locale: PublicLocale) {
  if (lead.areaScope === "large_single_area" || lead.areaScope === "wide_area") {
    return null;
  }

  if (lead.approximateSizeCm) {
    return `${Math.round(lead.approximateSizeCm)} cm`;
  }

  return (
    formatApproximateSizeLabel(lead) ??
    sizeLabels[locale === "tr" ? "tr" : "en"][lead.sizeCategory]
  );
}

function getDisplayedEstimate(lead: ClientSubmission, currency: string) {
  return lead.displayEstimateLabel ?? formatCompactCurrencyRange(lead.estimatedMin, lead.estimatedMax, currency);
}

function getCoverageLabel(lead: ClientSubmission, locale: PublicLocale) {
  if (lead.areaScope === "wide_area") {
    return lead.wideAreaTarget ? getWideAreaTargetLabel(lead.wideAreaTarget, locale) : null;
  }

  if (lead.areaScope === "large_single_area") {
    return lead.largeAreaCoverage ? getLargeAreaCoverageLabel(lead.largeAreaCoverage, locale) : null;
  }

  return null;
}

function getAreaLabel(lead: ClientSubmission, locale: PublicLocale) {
  return lead.areaScope ? getAreaScopeLabel(lead.areaScope, locale) : null;
}

function getLeadTypeLabel(lead: ClientSubmission, locale: PublicLocale) {
  if (lead.pricingSource === "featured_design" || lead.selectedDesignId) {
    return locale === "tr" ? "Hazır tasarım" : "Ready-made design";
  }

  if (lead.requestType) {
    return getRequestTypeLabel(lead.requestType, locale);
  }

  return formatIntent(lead.intent, locale);
}

function getSelectedDesignLabel(lead: ClientSubmission, designs: ArtistFeaturedDesign[]) {
  if (!lead.selectedDesignId) {
    return null;
  }

  return designs.find((design) => design.id === lead.selectedDesignId)?.title ?? null;
}

function getRequestLabel(
  lead: ClientSubmission,
  locale: PublicLocale,
  designs: ArtistFeaturedDesign[],
) {
  return getSelectedDesignLabel(lead, designs) ?? getLeadTypeLabel(lead, locale);
}

function getPreferredTimingLabel(lead: ClientSubmission, locale: PublicLocale, noTiming: string) {
  if (lead.preferredStartDate && lead.preferredEndDate) {
    return `${lead.preferredStartDate} - ${lead.preferredEndDate}`;
  }

  if (lead.preferredStartDate) {
    return lead.preferredStartDate;
  }

  if (lead.preferredEndDate) {
    return lead.preferredEndDate;
  }

  return noTiming;
}

function getReferenceImageUrl(lead: ClientSubmission) {
  return lead.referenceImageUrl ?? null;
}

function getStatusTone(status: LeadStatus) {
  switch (status) {
    case "new":
      return "border-[rgba(214,177,122,0.28)] bg-[rgba(214,177,122,0.12)] text-[var(--accent-soft)]";
    case "contacted":
      return "border-[rgba(160,177,197,0.18)] bg-[rgba(126,145,168,0.08)] text-[#DDE6F1]";
    case "sold":
      return "border-[rgba(63,115,90,0.42)] bg-[rgba(63,115,90,0.16)] text-[#B8E0C9]";
    case "lost":
      return "border-[rgba(184,106,99,0.22)] bg-[rgba(184,106,99,0.1)] text-[#DAB7B2]";
    default:
      return "border-white/10 bg-white/[0.04] text-[var(--text-muted)]";
  }
}

function getStatusControlTone(status: LeadStatus) {
  switch (status) {
    case "new":
      return "border-[rgba(214,177,122,0.26)] bg-[rgba(214,177,122,0.08)] text-[var(--text-primary)]";
    case "contacted":
      return "border-[rgba(160,177,197,0.18)] bg-[rgba(126,145,168,0.07)] text-[var(--text-primary)]";
    case "sold":
      return "border-[rgba(63,115,90,0.34)] bg-[rgba(63,115,90,0.12)] text-[var(--text-primary)]";
    case "lost":
      return "border-[rgba(184,106,99,0.2)] bg-[rgba(184,106,99,0.08)] text-[var(--text-primary)]";
    default:
      return "border-white/10 bg-white/[0.03] text-[var(--text-primary)]";
  }
}

function getStatusPriority(status: LeadStatus) {
  switch (status) {
    case "new":
      return 0;
    case "contacted":
      return 1;
    case "sold":
      return 2;
    case "lost":
    default:
      return 3;
  }
}

function sortLeads(leads: ClientSubmission[], sort: LeadSort) {
  const sorted = [...leads];

  sorted.sort((left, right) => {
    if (
      sort === "new-first" ||
      sort === "contacted-first" ||
      sort === "sold-first" ||
      sort === "lost-first"
    ) {
      const preferredStatus: LeadStatus =
        sort === "new-first"
          ? "new"
          : sort === "contacted-first"
            ? "contacted"
            : sort === "sold-first"
              ? "sold"
              : "lost";
      const leftPriority = left.status === preferredStatus ? -1 : getStatusPriority(left.status);
      const rightPriority = right.status === preferredStatus ? -1 : getStatusPriority(right.status);
      const priority = leftPriority - rightPriority;

      if (priority !== 0) {
        return priority;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }

    if (sort === "oldest") {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    }

    if (sort === "highest-estimate") {
      return getEstimateCenter(right) - getEstimateCenter(left);
    }

    if (sort === "lowest-estimate") {
      return getEstimateCenter(left) - getEstimateCenter(right);
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  return sorted;
}

function formatConversionRate(total: number, sold: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((sold / total) * 100)}%`;
}

function StatusBadge({
  status,
  locale,
}: {
  status: LeadStatus;
  locale: PublicLocale;
}) {
  const copy = leadCopy[locale].statusLabels;

  return (
    <Badge className={cn("normal-case tracking-normal", getStatusTone(status))}>
      {copy[status]}
    </Badge>
  );
}

function SummaryStat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "accent";
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] border px-4 py-3.5",
        tone === "accent"
          ? "border-[var(--border-strong)] bg-[linear-gradient(180deg,rgba(214,177,122,0.12),rgba(214,177,122,0.05))]"
          : "border-white/8 bg-white/[0.025]",
      )}
    >
      <p
        className={cn(
          "text-[11px] uppercase tracking-[0.18em]",
          tone === "accent" ? "text-[var(--accent-soft)]" : "text-[var(--text-muted)]",
        )}
      >
        {label}
      </p>
      <p className={cn("mt-2 text-[1.8rem] font-semibold tracking-[-0.03em]", tone === "accent" ? "text-[var(--text-primary)]" : "text-white")}>
        {value}
      </p>
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <div className="text-sm leading-6 text-white">{value}</div>
    </div>
  );
}

function StatusSelect({
  value,
  locale,
  onChange,
  compact = false,
}: {
  value: LeadStatus;
  locale: PublicLocale;
  onChange: (status: LeadStatus) => void;
  compact?: boolean;
}) {
  const copy = leadCopy[locale];

  return (
    <div>
      <NativeSelect
        value={value}
        onChange={(event) => onChange(event.target.value as LeadStatus)}
        className={cn(
          "min-w-[190px] shadow-none",
          getStatusControlTone(value),
          compact ? "h-10 rounded-[16px] text-sm" : "h-11 rounded-[18px]",
        )}
      >
        <option value="new">{copy.statusLabels.new}</option>
        <option value="contacted">{copy.statusLabels.contacted}</option>
        <option value="sold">{copy.statusLabels.sold}</option>
        <option value="lost">{copy.statusLabels.lost}</option>
      </NativeSelect>
    </div>
  );
}

export function LeadsTable({
  leads,
  currency,
  designs,
  locale = "en",
  hasPro = false,
  profilePlan = { planType: "free", accessStatus: "active" } as const,
}: {
  leads: ClientSubmission[];
  currency: string;
  designs: ArtistFeaturedDesign[];
  locale?: PublicLocale;
  hasPro?: boolean;
  profilePlan?: { planType: "free" | "pro"; accessStatus: "active" | "pending" | "blocked" };
}) {
  const copy = leadCopy[locale];
  const [localLeads, setLocalLeads] = useState(leads);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [sort, setSort] = useState<LeadSort>("newest");
  const [page, setPage] = useState(1);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const pageSize = 10;

  async function updateLeadStatus(id: string, status: LeadStatus) {
    const previousLead = localLeads.find((lead) => lead.id === id);
    if (!previousLead || previousLead.status === status) {
      return;
    }

    setStatusMessage(null);

    const optimistic: Partial<ClientSubmission> = {
      status,
      contacted: status === "contacted" || status === "sold",
      convertedToSale: status === "sold",
      updatedAt: new Date().toISOString(),
      soldAt:
        status === "sold"
          ? previousLead.status === "sold" && previousLead.soldAt
            ? previousLead.soldAt
            : new Date().toISOString()
          : null,
    };

    setLocalLeads((existing) =>
      existing.map((lead) => (lead.id === id ? { ...lead, ...optimistic } : lead)),
    );

    const response = await fetch(`/api/dashboard/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      setLocalLeads((existing) =>
        existing.map((lead) => (lead.id === id ? previousLead : lead)),
      );
      setStatusMessage(
        locale === "tr"
          ? "Durum güncellenemedi. Tekrar dene."
          : "Status could not be updated. Please try again.",
      );
    }
  }

  const filteredLeads = useMemo(() => sortLeads(localLeads, sort), [localLeads, sort]);

  const totalCount = localLeads.length;
  const contactedCount = localLeads.filter((lead) => lead.status !== "new").length;
  const soldCount = localLeads.filter((lead) => lead.status === "sold").length;
  const waitingCount = localLeads.filter((lead) => lead.status === "new").length;
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = useMemo(
    () => filteredLeads.slice((page - 1) * pageSize, page * pageSize),
    [filteredLeads, page],
  );
  const selectedLead = selectedLeadId ? localLeads.find((lead) => lead.id === selectedLeadId) ?? null : null;

  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  useEffect(() => {
    if (selectedLeadId && !localLeads.some((lead) => lead.id === selectedLeadId)) {
      setSelectedLeadId(null);
    }
  }, [localLeads, selectedLeadId]);

  useEffect(() => {
    setPage(1);
  }, [sort]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (localLeads.length === 0) {
    return (
      <Card className="surface-border">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.emptyDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-medium text-white">{copy.empty}</p>
        </CardContent>
      </Card>
    );
  }

  function toggleLeadDetails(leadId: string) {
    setSelectedLeadId((current) => (current === leadId ? null : leadId));
  }

  function renderLeadDetailPanel(lead: ClientSubmission) {
    const selectedDesign = getSelectedDesignLabel(lead, designs);
    const areaLabel = getAreaLabel(lead, locale);
    const placementSummary = formatLeadPlacementSummary(lead, locale);
    const placementDetail = formatPlacement(lead.bodyAreaDetail, locale);
    const sizeLabel = getSizeLabel(lead, locale);
    const coverageLabel = getCoverageLabel(lead, locale);
    const colorLabel = getDisplayedColor(lead, locale);
    const detailLevel = getDisplayedDetailLevel(lead, locale);
    const layoutLabel = getDisplayedLayout(lead, locale);
    const coverUpLabel =
      lead.coverUp === true || lead.requestType === "cover_up"
        ? getCoverUpLabel(true, locale)
        : null;
    const referenceImageUrl = getReferenceImageUrl(lead);
    const shownEstimate = getDisplayedEstimate(lead, currency);
    const preferredTiming = getPreferredTimingLabel(lead, locale, copy.table.noTiming);
    const createdAt = formatLeadDate(lead.createdAt, locale);
    const updatedAt = formatLeadDate(lead.updatedAt ?? lead.createdAt, locale);

    return (
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <div className="space-y-5">
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,var(--surface-1)_0%,rgba(16,17,20,0.92)_100%)] p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label={copy.table.intent} value={getLeadTypeLabel(lead, locale)} />
              {areaLabel ? <DetailField label={copy.table.area} value={areaLabel} /> : null}
              <DetailField
                label={copy.table.placement}
                value={lead.areaScope === "wide_area" ? placementSummary : placementDetail}
              />
              {coverageLabel ? <DetailField label={copy.table.coverage} value={coverageLabel} /> : null}
              {sizeLabel ? <DetailField label={copy.table.size} value={sizeLabel} /> : null}
              {colorLabel ? <DetailField label={copy.table.color} value={colorLabel} /> : null}
              {detailLevel ? <DetailField label={copy.table.detailLevel} value={detailLevel} /> : null}
              {layoutLabel ? <DetailField label={copy.table.layout} value={layoutLabel} /> : null}
              {lead.style ? <DetailField label={copy.table.styleNote} value={lead.style} /> : null}
              {coverUpLabel ? <DetailField label={copy.table.coverUp} value={coverUpLabel} /> : null}
              {selectedDesign ? <DetailField label={copy.table.selectedDesign} value={selectedDesign} /> : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,var(--surface-1)_0%,rgba(16,17,20,0.92)_100%)] p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label={copy.table.city} value={lead.city || copy.table.noCity} />
              <DetailField label={copy.table.timing} value={preferredTiming} />
              <DetailField label={copy.table.shownEstimate} value={shownEstimate} />
              <DetailField label={copy.table.createdAt} value={createdAt} />
              <DetailField label={copy.table.updatedAt} value={updatedAt} />
              {lead.status === "sold" ? (
                <DetailField label={copy.table.soldAt} value={lead.soldAt ? formatLeadDate(lead.soldAt, locale) : "—"} />
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,var(--surface-1)_0%,rgba(16,17,20,0.92)_100%)] p-5">
            <DetailField label={copy.table.notes} value={lead.notes || copy.table.noNotes} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,var(--surface-1)_0%,rgba(16,17,20,0.92)_100%)] p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">{copy.table.status}</p>
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between gap-3 rounded-[20px] border border-white/8 bg-white/[0.025] p-3">
                <StatusBadge status={lead.status} locale={locale} />
                <StatusSelect
                  value={lead.status}
                  locale={locale}
                  onChange={(status) => void updateLeadStatus(lead.id, status)}
                />
              </div>
              <div className="rounded-[20px] border border-white/8 bg-white/[0.02] p-3">
                <DetailField label={copy.table.updatedAt} value={updatedAt} />
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,var(--surface-1)_0%,rgba(16,17,20,0.92)_100%)] p-5">
            <BrandMonogram className="left-auto right-[-12%] top-[-12%] h-[180px] w-[180px]" opacity={0.055} />
            <div className="relative">
              <DetailField
                label={copy.table.reference}
                value={lead.referenceDescription || copy.table.noReference}
              />
              {referenceImageUrl ? (
                <div className="mt-4 space-y-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={referenceImageUrl}
                    alt="Reference"
                    className="h-56 w-full rounded-[18px] object-cover"
                  />
                  <a
                    href={referenceImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-[var(--accent-soft)] underline-offset-4 hover:underline"
                  >
                    {copy.table.openImage}
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="surface-border">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPro ? (
            <>
              {statusMessage ? (
                <p className="text-sm text-[var(--accent-soft)]">{statusMessage}</p>
              ) : null}
              <div className="rounded-[18px] border border-white/8 bg-white/[0.025] px-3.5 py-2.5 text-[13px] text-[var(--text-muted)]">
                {copy.note}
              </div>
              <div className="rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,var(--surface-1)_0%,rgba(16,17,20,0.92)_100%)] p-2.5">
                <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryStat label={copy.summary.total} value={totalCount} tone="accent" />
                  <SummaryStat label={copy.statusLabels.new} value={waitingCount} />
                  <SummaryStat label={copy.summary.waiting} value={contactedCount} />
                  <SummaryStat label={copy.summary.sold} value={`${soldCount} · ${formatConversionRate(contactedCount, soldCount)}`} />
                </div>
              </div>
            </>
          ) : (
            <UpgradeCard locale={locale} profile={profilePlan} />
          )}
        </CardContent>
      </Card>

      <Card className="surface-border">
        <CardHeader>
          <CardTitle>{locale === "tr" ? "Talepler" : "Requests"}</CardTitle>
          <CardDescription>
            {locale === "tr" ? "Filtrele, sırala ve detayları tek bakışta yönet." : "Filter, sort, and manage details at a glance."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3.5">
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.025] px-3 py-1.5">
              <ArrowUpDown className="size-4 text-[var(--text-muted)]" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {copy.filters.sort}
              </span>
              <NativeSelect
                value={sort}
                onChange={(event) => setSort(event.target.value as LeadSort)}
                className="h-8 min-w-[176px] rounded-full border-white/8 bg-[var(--surface-1)] py-0 text-[13px]"
              >
                <option value="newest">{copy.filters.newest}</option>
                <option value="oldest">{copy.filters.oldest}</option>
                <option value="highest-estimate">{copy.filters.highestEstimate}</option>
                <option value="lowest-estimate">{copy.filters.lowestEstimate}</option>
                <option value="new-first">{copy.filters.newFirst}</option>
                <option value="contacted-first">{copy.filters.contactedFirst}</option>
                <option value="sold-first">{copy.filters.soldFirst}</option>
                <option value="lost-first">{copy.filters.lostFirst}</option>
              </NativeSelect>
            </div>
          </div>

          <div className="space-y-2.5">
            {paginatedLeads.map((lead) => {
              const placementSummary = formatLeadPlacementSummary(lead, locale);
              const sizeLabel = getSizeLabel(lead, locale);
              const requestLabel = getRequestLabel(lead, locale, designs);
              const notesLabel = lead.notes ? notesPreview(lead.notes, copy.table.noNotes) : null;
              const areaLabel = getAreaLabel(lead, locale);
              const colorLabel = getDisplayedColor(lead, locale);
              const detailLabel = getDisplayedDetailLevel(lead, locale);
              const layoutLabel = getDisplayedLayout(lead, locale);
              const coverageLabel = getCoverageLabel(lead, locale);
              const selectedDesignLabel = getSelectedDesignLabel(lead, designs);
              const referenceImageUrl = getReferenceImageUrl(lead);
              const metadataTags = [
                areaLabel ? `${copy.table.area}: ${areaLabel}` : null,
                coverageLabel ? `${copy.table.coverage}: ${coverageLabel}` : null,
                colorLabel ? `${copy.table.color}: ${colorLabel}` : null,
                detailLabel ? `${copy.table.detailLevel}: ${detailLabel}` : null,
                layoutLabel ? `${copy.table.layout}: ${layoutLabel}` : null,
                selectedDesignLabel ? `${copy.table.selectedDesign}: ${selectedDesignLabel}` : null,
                referenceImageUrl ? copy.table.reference : null,
              ].filter(Boolean) as string[];

              return (
                <div
                  key={lead.id}
                  className="group rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,var(--surface-1)_0%,rgba(16,17,20,0.92)_100%)] p-3.5 transition hover:border-white/14 hover:bg-[linear-gradient(180deg,var(--surface-2)_0%,rgba(18,20,24,0.98)_100%)]"
                >
                  <div className="grid gap-3 xl:grid-cols-[minmax(170px,0.82fr)_minmax(0,1.45fr)_minmax(210px,0.95fr)] xl:items-center">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3 xl:block">
                        <div>
                          <p className="text-[1.45rem] font-semibold tracking-[-0.03em] text-white">{getDisplayedEstimate(lead, currency)}</p>
                          <p className="mt-1 text-xs text-[var(--text-muted)]">{formatLeadDate(lead.createdAt, locale)}</p>
                        </div>
                        <StatusBadge status={lead.status} locale={locale} />
                      </div>
                    </div>

                    <div className="min-w-0 space-y-2">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-white">{requestLabel}</p>
                        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{[placementSummary, sizeLabel].filter(Boolean).join(" • ")}</p>
                      </div>
                      {lead.city ? (
                        <p className="text-sm text-[var(--text-muted)]">{lead.city}</p>
                      ) : null}
                      {notesLabel ? (
                        <p className="line-clamp-2 text-[13px] leading-5 text-[var(--text-muted)]">{notesLabel}</p>
                      ) : null}
                      <div className="flex flex-wrap gap-1.5 text-[11px] text-[var(--text-muted)]">
                        {metadataTags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 xl:items-end">
                      <div className="w-full xl:max-w-[220px]">
                        <StatusSelect
                          value={lead.status}
                          locale={locale}
                          compact
                          onChange={(status) => void updateLeadStatus(lead.id, status)}
                        />
                      </div>
                      <div className="flex w-full justify-end gap-2 xl:w-auto xl:items-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          onClick={() => toggleLeadDetails(lead.id)}
                        >
                          {copy.table.detailButton}
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-2.5 rounded-[20px] border border-white/8 bg-white/[0.025] p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-[var(--text-muted)]">{copy.table.pageSummary(page, totalPages)}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {copy.table.previous}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={page === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                {copy.table.next}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedLead ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,var(--bg-elevated)_0%,#0d0e10_100%)] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.38)] sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/8 pb-5">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{copy.table.details}</p>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">{getRequestLabel(selectedLead, locale, designs)}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {[
                    getAreaLabel(selectedLead, locale),
                    selectedLead.areaScope === "wide_area"
                      ? formatLeadPlacementSummary(selectedLead, locale)
                      : formatPlacement(selectedLead.bodyAreaDetail, locale),
                    getSizeLabel(selectedLead, locale),
                  ].filter(Boolean).join(" • ")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedLead.status} locale={locale} />
                <Button type="button" variant="outline" size="icon" className="rounded-full" onClick={() => setSelectedLeadId(null)}>
                  <X className="size-4" />
                </Button>
              </div>
            </div>
            <div className="mt-5 max-h-[75vh] overflow-y-auto pr-1">{renderLeadDetailPanel(selectedLead)}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
