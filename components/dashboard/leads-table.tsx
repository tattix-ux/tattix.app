"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ImageIcon, StickyNote } from "lucide-react";

import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { bodyPlacementGroups, getPlacementDetailLabel } from "@/lib/constants/body-placement";
import { formatApproximateSizeLabel } from "@/lib/constants/size-estimation";
import { intentOptions, styleOptions } from "@/lib/constants/options";
import type { PublicLocale } from "@/lib/i18n/public";
import { getRequestTypeLabel, getWorkStyleLabel } from "@/lib/pricing/v2/output";
import type { ArtistFeaturedDesign, ClientSubmission, LeadStatus } from "@/lib/types";
import { cn, formatCompactCurrencyRange, notesPreview } from "@/lib/utils";

type FilterRange = "7d" | "30d" | "90d" | "all";
type ChartGranularity = "daily" | "weekly" | "monthly";
type LeadStatusFilter = "all" | LeadStatus;
type LeadSort = "waiting-first" | "newest" | "oldest" | "highest-estimate" | "lowest-estimate";

const leadCopy = {
  en: {
    title: "Lead management",
    description: "Review incoming requests and track their status.",
    note: "Note: clients start the conversation. Update the status after they reach out.",
    empty: "No requests yet.",
    emptyDescription: "Share your link to start collecting requests.",
    emptyFiltered: "No requests match these filters.",
    resetFilters: "Clear filters",
    summary: {
      waiting: "Waiting for contact",
      total: "Total requests",
      fresh: "Waiting for contact",
      sold: "Sold",
      rate: "Sale rate",
    },
    filters: {
      status: "Status",
      time: "Date range",
      waitingOnly: "Only waiting for contact",
      all: "All",
      "7d": "Last 7 days",
      "30d": "Last 30 days",
      "90d": "Last 3 months",
      contacted: "Contacted",
      sold: "Sold",
      lost: "Lost",
      waitingFirst: "Waiting first",
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
    chartTitle: "Request trend",
    chartDescription: "Show chart",
    chartToggle: "Chart view",
    requests: "Requests",
    sales: "Sales",
    granularity: {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    },
    table: {
      estimate: "Estimate",
      request: "Request",
      details: "Details",
      status: "Status",
      actions: "Status tracking",
      detailButton: "Details",
      markContacted: "Mark as contacted",
      markSold: "Mark as sold",
      markLost: "Mark as lost",
      placement: "Placement",
      size: "Size",
      intent: "Request type",
      style: "Style",
      workStyle: "Work style",
      city: "City",
      timing: "Preferred time",
      notes: "Notes",
      reference: "Reference image",
      shownEstimate: "Estimate shown",
      selectedDesign: "Selected design",
      source: "Source",
      noCity: "Not shared",
      noTiming: "Not shared",
      noNotes: "No notes",
      noReference: "No reference image",
      noDesign: "No design selected",
      soldAt: "Marked sold",
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
    emptyFiltered: "Bu filtrelerle eşleşen talep bulunamadı.",
    resetFilters: "Filtreleri temizle",
    summary: {
      waiting: "İletişim bekleniyor",
      total: "Toplam talep",
      fresh: "İletişim bekleniyor",
      sold: "Satış yapıldı",
      rate: "Satış oranı",
    },
    filters: {
      status: "Durum",
      time: "Zaman",
      waitingOnly: "Sadece iletişim bekleyenler",
      all: "Tümü",
      "7d": "Son 7 gün",
      "30d": "Son 30 gün",
      "90d": "Son 3 ay",
      contacted: "İletişime geçildi",
      sold: "Satış yapıldı",
      lost: "Satış olmadı",
      waitingFirst: "İletişim bekleyen önce",
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
    chartTitle: "Talep görünümü",
    chartDescription: "Grafiği göster",
    chartToggle: "Grafik görünümü",
    requests: "Talep",
    sales: "Satış",
    granularity: {
      daily: "Günlük",
      weekly: "Haftalık",
      monthly: "Aylık",
    },
    table: {
      estimate: "Tahmin",
      request: "Talep",
      details: "Detaylar",
      status: "Durum",
      actions: "Durum takibi",
      detailButton: "Detay",
      markContacted: "İletişime geçildi olarak işaretle",
      markSold: "Satış yapıldı",
      markLost: "Satış olmadı",
      placement: "Yerleşim",
      size: "Yaklaşık boyut",
      intent: "Talep tipi",
      style: "Stil",
      workStyle: "İşçilik karakteri",
      city: "Şehir",
      timing: "Tercih edilen zaman",
      notes: "Notlar",
      reference: "Referans görsel",
      shownEstimate: "Müşteriye gösterilen tahmin",
      selectedDesign: "Seçilen tasarım",
      source: "Kaynak",
      noCity: "Paylaşılmadı",
      noTiming: "Paylaşılmadı",
      noNotes: "Not yok",
      noReference: "Referans görsel yok",
      noDesign: "Hazır tasarım seçilmedi",
      soldAt: "Satış tarihi",
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

const styleLabelsTr: Record<string, string> = {
  "fine-line": "Fine line",
  minimal: "Minimal",
  blackwork: "Blackwork",
  realistic: "Realistic",
  realism: "Realistic",
  "micro-realism": "Micro realism",
  "not-sure-style": "Emin değilim",
  custom: "Özel",
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

function formatStyle(style: ClientSubmission["style"], locale: PublicLocale) {
  if (locale === "tr") {
    return styleLabelsTr[style] ?? style;
  }

  return styleOptions.find((item) => item.value === style)?.label ?? style;
}

function getDisplayedWorkStyle(lead: ClientSubmission, locale: PublicLocale) {
  if (lead.workStyle) {
    return getWorkStyleLabel(lead.workStyle, locale);
  }

  return formatStyle(lead.style, locale);
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

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  const diff = (day + 6) % 7;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - diff);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatBucketLabel(date: Date, granularity: ChartGranularity, locale: PublicLocale) {
  if (granularity === "daily") {
    return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
      day: "2-digit",
      month: "short",
    }).format(date);
  }

  if (granularity === "weekly") {
    return locale === "tr"
      ? `Hf ${new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short" }).format(date)}`
      : `Wk ${new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date)}`;
  }

  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-GB", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function getRangeStart(range: FilterRange) {
  const now = new Date();

  if (range === "all") {
    return null;
  }

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const start = new Date(now);
  start.setDate(now.getDate() - days + 1);
  return startOfDay(start);
}

function getEstimateCenter(lead: ClientSubmission) {
  return (lead.estimatedMin + lead.estimatedMax) / 2;
}

function getSizeLabel(lead: ClientSubmission, locale: PublicLocale) {
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

function getPricingSourceLabel(lead: ClientSubmission, locale: PublicLocale) {
  if (lead.pricingSource === "featured_design") {
    return locale === "tr" ? "Hazır tasarım" : "Featured design";
  }

  return locale === "tr" ? "Serbest talep" : "Custom request";
}

function getRequestLabel(lead: ClientSubmission, locale: PublicLocale, designs: ArtistFeaturedDesign[]) {
  if (lead.pricingSource === "featured_design") {
    const selectedDesign = designs.find((design) => design.id === lead.selectedDesignId);
    return selectedDesign?.title ?? formatIntent(lead.intent, locale);
  }

  if (lead.requestType) {
    return getRequestTypeLabel(lead.requestType, locale);
  }

  return formatIntent(lead.intent, locale);
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
      return "border-amber-400/35 bg-amber-400/14 text-amber-100";
    case "contacted":
      return "border-sky-400/30 bg-sky-400/12 text-sky-100";
    case "sold":
      return "border-emerald-500/30 bg-emerald-500/12 text-emerald-200";
    case "lost":
      return "border-white/10 bg-white/6 text-[var(--foreground-muted)]";
    default:
      return "border-white/10 bg-white/6 text-[var(--foreground-muted)]";
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

function filterLeads(
  leads: ClientSubmission[],
  {
    status,
    range,
    waitingOnly,
  }: {
    status: LeadStatusFilter;
    range: FilterRange;
    waitingOnly: boolean;
  },
) {
  const start = getRangeStart(range);

  return leads.filter((lead) => {
    if (waitingOnly && lead.status !== "new") {
      return false;
    }

    if (status !== "all" && lead.status !== status) {
      return false;
    }

    if (start && new Date(lead.createdAt) < start) {
      return false;
    }

    return true;
  });
}

function sortLeads(leads: ClientSubmission[], sort: LeadSort) {
  const sorted = [...leads];

  sorted.sort((left, right) => {
    if (sort === "waiting-first") {
      const priority = getStatusPriority(left.status) - getStatusPriority(right.status);

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

function buildChartData(
  leads: ClientSubmission[],
  granularity: ChartGranularity,
  locale: PublicLocale,
) {
  const buckets = new Map<string, { label: string; total: number; sold: number; date: Date }>();

  leads.forEach((lead) => {
    const source = new Date(lead.createdAt);
    const bucketDate =
      granularity === "daily"
        ? startOfDay(source)
        : granularity === "weekly"
          ? startOfWeek(source)
          : startOfMonth(source);

    const key = bucketDate.toISOString();
    const existing = buckets.get(key) ?? {
      label: formatBucketLabel(bucketDate, granularity, locale),
      total: 0,
      sold: 0,
      date: bucketDate,
    };

    existing.total += 1;
    existing.sold += lead.status === "sold" ? 1 : 0;
    buckets.set(key, existing);
  });

  return Array.from(buckets.values()).sort((left, right) => left.date.getTime() - right.date.getTime());
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

function StatCard({
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
        "rounded-[24px] border p-4",
        tone === "accent"
          ? "border-amber-400/20 bg-amber-400/10"
          : "border-white/8 bg-black/20",
      )}
    >
      <p
        className={cn(
          "text-xs uppercase tracking-[0.18em]",
          tone === "accent" ? "text-amber-100/80" : "text-[var(--foreground-muted)]",
        )}
      >
        {label}
      </p>
      <p className={cn("mt-2 text-3xl font-semibold", tone === "accent" ? "text-amber-50" : "text-white")}>
        {value}
      </p>
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
  const [statusFilter, setStatusFilter] = useState<LeadStatusFilter>("all");
  const [waitingOnly, setWaitingOnly] = useState(true);
  const [range, setRange] = useState<FilterRange>("all");
  const [sort, setSort] = useState<LeadSort>("waiting-first");
  const [granularity, setGranularity] = useState<ChartGranularity>("weekly");
  const [chartOpen, setChartOpen] = useState(false);
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
      return;
    }
  }

  const filteredLeads = useMemo(
    () =>
      sortLeads(
        filterLeads(localLeads, {
          status: statusFilter,
          range,
          waitingOnly,
        }),
        sort,
      ),
    [localLeads, range, sort, statusFilter, waitingOnly],
  );

  const totalCount = filteredLeads.length;
  const newCount = filteredLeads.filter((lead) => lead.status === "new").length;
  const contactedCount = filteredLeads.filter((lead) => lead.status !== "new").length;
  const soldCount = filteredLeads.filter((lead) => lead.status === "sold").length;
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = useMemo(
    () => filteredLeads.slice((page - 1) * pageSize, page * pageSize),
    [filteredLeads, page],
  );
  const chartData = useMemo(
    () => buildChartData(filteredLeads, granularity, locale),
    [filteredLeads, granularity, locale],
  );
  const chartMax = Math.max(...chartData.flatMap((item) => [item.total, item.sold]), 1);

  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, range, sort, waitingOnly]);

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

  function renderLeadActions(lead: ClientSubmission, compact = false) {
    if (lead.status === "new") {
      return (
        <Button
          size={compact ? "sm" : "default"}
          onClick={() => void updateLeadStatus(lead.id, "contacted")}
          className={cn(compact ? "h-9" : "h-10", "rounded-full")}
        >
          {copy.table.markContacted}
        </Button>
      );
    }

    if (lead.status === "contacted") {
      return (
        <div className={cn("flex gap-2", compact ? "flex-col" : "flex-wrap")}>
          <Button
            size={compact ? "sm" : "default"}
            onClick={() => void updateLeadStatus(lead.id, "sold")}
            className={cn(compact ? "h-9" : "h-10", "rounded-full")}
          >
            {copy.table.markSold}
          </Button>
          <Button
            size={compact ? "sm" : "default"}
            variant="outline"
            onClick={() => void updateLeadStatus(lead.id, "lost")}
            className={cn(compact ? "h-9" : "h-10", "rounded-full")}
          >
            {copy.table.markLost}
          </Button>
        </div>
      );
    }

    return null;
  }

  function renderLeadDetailPanel(lead: ClientSubmission) {
    const selectedDesign = lead.selectedDesignId
      ? designs.find((design) => design.id === lead.selectedDesignId)?.title ?? copy.table.noDesign
      : copy.table.noDesign;

    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{copy.table.intent}</p>
              <p className="text-sm text-white">{getRequestLabel(lead, locale, designs)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{copy.table.placement}</p>
              <p className="text-sm text-white">{formatPlacement(lead.bodyAreaDetail, locale)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{copy.table.size}</p>
              <p className="text-sm text-white">{getSizeLabel(lead, locale)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                {lead.workStyle ? copy.table.workStyle : copy.table.style}
              </p>
              <p className="text-sm text-white">{getDisplayedWorkStyle(lead, locale)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{copy.table.city}</p>
              <p className="text-sm text-white">{lead.city || copy.table.noCity}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{copy.table.timing}</p>
              <p className="text-sm text-white">{getPreferredTimingLabel(lead, locale, copy.table.noTiming)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{copy.table.shownEstimate}</p>
              <p className="text-sm text-white">{getDisplayedEstimate(lead, currency)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{copy.table.selectedDesign}</p>
              <p className="text-sm text-white">{selectedDesign}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{copy.table.source}</p>
              <p className="text-sm text-white">{getPricingSourceLabel(lead, locale)}</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{copy.table.notes}</p>
              <p className="text-sm text-white">{lead.notes || copy.table.noNotes}</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{copy.table.soldAt}</p>
              <p className="text-sm text-white">
                {lead.soldAt ? formatLeadDate(lead.soldAt, locale) : copy.statusLabels[lead.status]}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{copy.table.reference}</p>
                <p className="mt-1 text-sm text-white">{lead.referenceDescription || copy.table.noReference}</p>
              </div>
              <StatusBadge status={lead.status} locale={locale} />
            </div>
            {getReferenceImageUrl(lead) ? (
              <div className="mt-4 space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getReferenceImageUrl(lead) ?? ""}
                  alt="Reference"
                  className="h-56 w-full rounded-[18px] object-cover"
                />
                <a
                  href={getReferenceImageUrl(lead) ?? "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-[var(--accent-soft)] underline-offset-4 hover:underline"
                >
                  {copy.table.openImage}
                </a>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--foreground-muted)]">{copy.table.noReference}</p>
            )}
          </div>

          <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{copy.table.status}</p>
            <div className="mt-3 flex flex-col gap-3">
              <StatusBadge status={lead.status} locale={locale} />
              {renderLeadActions(lead) ? <div>{renderLeadActions(lead)}</div> : null}
              <p className="text-sm text-[var(--foreground-muted)]">
                {copy.statusLabels[lead.status]}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="surface-border">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {hasPro ? (
            <>
              {statusMessage ? (
                <p className="text-sm text-[var(--accent-soft)]">{statusMessage}</p>
              ) : null}
              <div className="rounded-[24px] border border-white/8 bg-black/20 px-4 py-3 text-sm text-[var(--foreground-muted)]">
                {copy.note}
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard label={copy.summary.waiting} value={newCount} tone="accent" />
                <StatCard label={copy.summary.total} value={totalCount} />
                <StatCard label={copy.summary.sold} value={soldCount} />
                <StatCard label={copy.summary.rate} value={formatConversionRate(contactedCount, soldCount)} />
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between rounded-[18px] border-white/10 bg-black/20 text-left text-white hover:bg-white/5"
                  onClick={() => setChartOpen((current) => !current)}
                >
                  <span>{copy.chartToggle}</span>
                  <ChevronDown
                    className={cn("size-5 text-[var(--foreground-muted)] transition-transform", chartOpen ? "rotate-180" : "")}
                  />
                </Button>

                {chartOpen ? (
                  <div className="mt-5 space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                        <span className="inline-flex items-center gap-2">
                          <span className="size-2 rounded-full bg-white" />
                          {copy.requests}
                        </span>
                        <span className="inline-flex items-center gap-2">
                          <span className="size-2 rounded-full bg-[var(--accent)]" />
                          {copy.sales}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(["daily", "weekly", "monthly"] as const).map((item) => (
                          <Button
                            key={item}
                            type="button"
                            size="sm"
                            variant={granularity === item ? "secondary" : "outline"}
                            onClick={() => setGranularity(item)}
                          >
                            {copy.granularity[item]}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {chartData.length === 0 ? (
                      <p className="text-sm text-[var(--foreground-muted)]">{copy.emptyFiltered}</p>
                    ) : (
                      <div className="grid h-52 grid-cols-[repeat(auto-fit,minmax(52px,1fr))] items-end gap-3">
                        {chartData.map((item) => (
                          <div key={item.label} className="flex min-w-0 flex-col items-center gap-2">
                            <div className="flex h-36 w-full items-end justify-center gap-1">
                              <div
                                className="w-3 rounded-t-full bg-white/85"
                                style={{ height: `${Math.max((item.total / chartMax) * 100, 8)}%` }}
                                title={`${copy.requests}: ${item.total}`}
                              />
                              <div
                                className="w-3 rounded-t-full bg-[var(--accent)]"
                                style={{ height: `${Math.max((item.sold / chartMax) * 100, item.sold ? 8 : 0)}%` }}
                                title={`${copy.sales}: ${item.sold}`}
                              />
                            </div>
                            <p className="truncate text-center text-[11px] text-[var(--foreground-muted)]">
                              {item.label}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <UpgradeCard locale={locale} profile={profilePlan} />
          )}
        </CardContent>
      </Card>

      <Card className="surface-border">
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                    {copy.filters.status}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["all", "new", "contacted", "sold", "lost"] as const).map((item) => (
                      <Button
                        key={item}
                        type="button"
                        size="sm"
                        variant={statusFilter === item ? "secondary" : "outline"}
                        onClick={() => {
                          setStatusFilter(item);
                          if (item !== "all" && item !== "new") {
                            setWaitingOnly(false);
                          }
                        }}
                      >
                        {copy.statusLabels[item]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Button
                    type="button"
                    size="sm"
                    variant={waitingOnly ? "secondary" : "outline"}
                    onClick={() => {
                      setWaitingOnly((current) => {
                        const next = !current;
                        if (next) {
                          setStatusFilter("all");
                        }
                        return next;
                      });
                    }}
                  >
                    {copy.filters.waitingOnly}
                  </Button>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                    {copy.filters.time}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["7d", "30d", "90d", "all"] as const).map((item) => (
                      <Button
                        key={item}
                        type="button"
                        size="sm"
                        variant={range === item ? "secondary" : "outline"}
                        onClick={() => setRange(item)}
                      >
                        {item === "all" ? copy.filters.all : copy.filters[item]}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="w-full max-w-xs">
                <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">
                  {copy.filters.sort}
                </p>
                <NativeSelect
                  value={sort}
                  onChange={(event) => setSort(event.target.value as LeadSort)}
                >
                  <option value="waiting-first">{copy.filters.waitingFirst}</option>
                  <option value="newest">{copy.filters.newest}</option>
                  <option value="oldest">{copy.filters.oldest}</option>
                  <option value="highest-estimate">{copy.filters.highestEstimate}</option>
                  <option value="lowest-estimate">{copy.filters.lowestEstimate}</option>
                </NativeSelect>
              </div>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="rounded-[24px] border border-white/8 bg-black/20 p-6 text-center">
              <p className="text-lg font-medium text-white">{copy.emptyFiltered}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                {copy.description}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setStatusFilter("all");
                  setWaitingOnly(true);
                  setRange("all");
                  setSort("waiting-first");
                }}
              >
                {copy.resetFilters}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 lg:hidden">
                {paginatedLeads.map((lead) => (
                  <div key={lead.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-2xl font-semibold text-white">
                          {getDisplayedEstimate(lead, currency)}
                        </p>
                        <p className="mt-1 text-sm text-white">
                          {formatPlacement(lead.bodyAreaDetail, locale)} · {getSizeLabel(lead, locale)}
                        </p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {getRequestLabel(lead, locale, designs)}
                        </p>
                      </div>
                      <StatusBadge status={lead.status} locale={locale} />
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[var(--foreground-muted)]">
                      <span>{formatLeadDate(lead.createdAt, locale)}</span>
                      <span>{copy.table.source}: {getPricingSourceLabel(lead, locale)}</span>
                      {getReferenceImageUrl(lead) ? (
                        <span className="inline-flex items-center gap-1">
                          <ImageIcon className="size-4" />
                          {copy.table.reference}
                        </span>
                      ) : null}
                      {lead.notes ? (
                        <span className="inline-flex items-center gap-1">
                          <StickyNote className="size-4" />
                          {copy.table.notes}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-sm text-[var(--foreground-muted)]">
                      {notesPreview(lead.notes, copy.table.noNotes)}
                    </p>

                    <div className="mt-4 space-y-2">
                      {renderLeadActions(lead, true)}
                      <Button variant="outline" onClick={() => toggleLeadDetails(lead.id)}>
                        {copy.table.detailButton}
                      </Button>
                    </div>

                    {selectedLeadId === lead.id ? (
                      <div className="mt-4">
                        {renderLeadDetailPanel(lead)}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className="hidden overflow-hidden rounded-[24px] border border-white/8 lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{copy.table.estimate}</TableHead>
                      <TableHead>{copy.table.request}</TableHead>
                      <TableHead>{copy.table.details}</TableHead>
                      <TableHead>{copy.table.status}</TableHead>
                      <TableHead>{copy.table.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLeads.map((lead) => (
                      <Fragment key={lead.id}>
                        <TableRow>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <p className="text-lg font-semibold text-white">
                                {getDisplayedEstimate(lead, currency)}
                              </p>
                              <p className="text-xs text-[var(--foreground-muted)]">
                                {formatLeadDate(lead.createdAt, locale)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-1">
                              <p className="font-medium text-white">
                                {formatPlacement(lead.bodyAreaDetail, locale)} · {getSizeLabel(lead, locale)}
                              </p>
                              <p className="text-sm text-[var(--foreground-muted)]">
                                {getRequestLabel(lead, locale, designs)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="space-y-2">
                              <p className="text-sm text-[var(--foreground-muted)]">
                                {copy.table.source}: {getPricingSourceLabel(lead, locale)}
                              </p>
                              <p className="text-sm text-[var(--foreground-muted)]">
                                {notesPreview(lead.notes, copy.table.noNotes)}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {getReferenceImageUrl(lead) ? (
                                  <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/20 px-3 py-1 text-xs text-[var(--foreground-muted)]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={getReferenceImageUrl(lead) ?? ""}
                                      alt="Reference"
                                      className="size-5 rounded-full object-cover"
                                    />
                                    {copy.table.reference}
                                  </span>
                                ) : null}
                                {lead.notes ? (
                                  <span className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-black/20 px-3 py-1 text-xs text-[var(--foreground-muted)]">
                                    <StickyNote className="size-3.5" />
                                    {copy.table.notes}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <StatusBadge status={lead.status} locale={locale} />
                          </TableCell>
                          <TableCell className="align-top">
                            <div className="flex min-w-[240px] flex-col gap-2">
                              {renderLeadActions(lead, true)}
                              <Button size="sm" variant="outline" onClick={() => toggleLeadDetails(lead.id)}>
                                {copy.table.detailButton}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {selectedLeadId === lead.id ? (
                          <TableRow>
                            <TableCell colSpan={5}>{renderLeadDetailPanel(lead)}</TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-3 rounded-[24px] border border-white/8 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--foreground-muted)]">
                  {copy.table.pageSummary(page, totalPages)}
                </p>
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
