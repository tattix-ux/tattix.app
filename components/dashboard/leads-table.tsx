"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, TrendingUp, X } from "lucide-react";

import { UpgradeCard } from "@/components/dashboard/upgrade-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPlacementDetailLabel } from "@/lib/constants/body-placement";
import { formatApproximateSizeLabel } from "@/lib/constants/size-estimation";
import { intentOptions, styleOptions } from "@/lib/constants/options";
import type { PublicLocale } from "@/lib/i18n/public";
import type { ArtistFeaturedDesign, ClientSubmission } from "@/lib/types";
import { formatCompactCurrencyRange, formatDateLabel, notesPreview } from "@/lib/utils";

type FilterRange = "7d" | "30d" | "90d" | "all";
type ChartGranularity = "daily" | "weekly" | "monthly";

const leadCopy = {
  en: {
    title: "Leads",
    empty: "No submissions yet. Share your Tattix link in bio to start collecting requests.",
    description: "Every finished estimate lands here with enough context to continue in WhatsApp or Instagram.",
    totalRequests: "Total requests",
    soldRequests: "Sold requests",
    conversionRate: "Conversion rate",
    summary: (total: number, sold: number) =>
      `You received ${total} requests and converted ${sold} into sales.`,
    filters: {
      "7d": "Last 7 days",
      "30d": "Last 30 days",
      "90d": "Last 3 months",
      all: "All time",
    },
    granularity: {
      daily: "Daily",
      weekly: "Weekly",
      monthly: "Monthly",
    },
    chartTitle: "Request trend",
    chartDescription: "Compare incoming requests and sold jobs over time.",
    requests: "Requests",
    sold: "Sold",
    date: "Date",
    intent: "Intent",
    placement: "Placement",
    style: "Style",
    estimate: "Estimate",
    notes: "Notes",
    status: "Status",
    size: "Approx. size",
    city: "City",
    details: "Details",
    viewDetails: "View details",
    noNotes: "No notes provided.",
    noReferenceDescription: "No reference description.",
    noTiming: "No timing shared.",
    noDesign: "No ready-made design selected.",
    noCity: "No city shared.",
    noReferenceImage: "No reference image uploaded.",
    openFullImage: "Open full image",
    leadStatus: "Lead status",
    contacted: "Contacted",
    new: "New",
    markContacted: "Mark contacted",
    markNotContacted: "Mark not contacted",
    soldBadge: "Sold",
    unsoldBadge: "Open",
    markSold: "Mark sold",
    markUnsold: "Mark unsold",
    soldAt: "Sold at",
    page: "Page",
    previous: "Previous",
    next: "Next",
    pageSummary: (current: number, total: number) => `Page ${current} of ${total}`,
  },
  tr: {
    title: "Talepler",
    empty: "Henüz talep yok. İstek toplamaya başlamak için Tattix linkini biyona ekle.",
    description: "Tamamlanan her tahmin, WhatsApp veya Instagram’dan devam edebilmen için burada saklanır.",
    totalRequests: "Toplam talep",
    soldRequests: "Satışa dönen",
    conversionRate: "Dönüşüm oranı",
    summary: (total: number, sold: number) =>
      `${total} talep aldın ve bunların ${sold} tanesini satışa dönüştürdün.`,
    filters: {
      "7d": "Son 7 gün",
      "30d": "Son 30 gün",
      "90d": "Son 3 ay",
      all: "Tüm zamanlar",
    },
    granularity: {
      daily: "Günlük",
      weekly: "Haftalık",
      monthly: "Aylık",
    },
    chartTitle: "Talep grafiği",
    chartDescription: "Gelen talepleri ve satışa dönen işleri zaman içinde karşılaştır.",
    requests: "Talepler",
    sold: "Satışlar",
    date: "Tarih",
    intent: "Talep",
    placement: "Yerleşim",
    style: "Stil",
    estimate: "Tahmin",
    notes: "Notlar",
    status: "Durum",
    size: "Yakl. boyut",
    city: "Şehir",
    details: "Detay",
    viewDetails: "Detayları gör",
    noNotes: "Not bırakılmadı.",
    noReferenceDescription: "Referans açıklaması yok.",
    noTiming: "Zaman bilgisi paylaşılmadı.",
    noDesign: "Hazır tasarım seçilmedi.",
    noCity: "Şehir bilgisi paylaşılmadı.",
    noReferenceImage: "Referans görsel yüklenmedi.",
    openFullImage: "Görseli aç",
    leadStatus: "Talep durumu",
    contacted: "İletişime geçildi",
    new: "Yeni",
    markContacted: "İletişime geçildi olarak işaretle",
    markNotContacted: "İletişime geçilmedi olarak işaretle",
    soldBadge: "Satış",
    unsoldBadge: "Açık",
    markSold: "Satış olarak işaretle",
    markUnsold: "Satış değil",
    soldAt: "Satış tarihi",
    page: "Sayfa",
    previous: "Önceki",
    next: "Sonraki",
    pageSummary: (current: number, total: number) => `${current} / ${total}. sayfa`,
  },
} as const;

function formatIntent(intent: ClientSubmission["intent"]) {
  return intentOptions.find((item) => item.value === intent)?.label ?? intent;
}

function formatStyle(style: ClientSubmission["style"]) {
  return styleOptions.find((item) => item.value === style)?.label ?? style;
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

function filterLeads(leads: ClientSubmission[], range: FilterRange) {
  const start = getRangeStart(range);

  if (!start) {
    return leads;
  }

  return leads.filter((lead) => new Date(lead.createdAt) >= start);
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
    existing.sold += lead.convertedToSale ? 1 : 0;
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
  const [selectedLead, setSelectedLead] = useState<ClientSubmission | null>(null);
  const [range, setRange] = useState<FilterRange>("30d");
  const [granularity, setGranularity] = useState<ChartGranularity>("daily");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  async function updateLead(
    id: string,
    payload: { contacted?: boolean; convertedToSale?: boolean },
    optimistic: Partial<ClientSubmission>,
  ) {
    const response = await fetch(`/api/dashboard/leads/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return;
    }

    setLocalLeads((existing) =>
      existing.map((lead) => (lead.id === id ? { ...lead, ...optimistic } : lead)),
    );
    setSelectedLead((existing) =>
      existing && existing.id === id ? { ...existing, ...optimistic } : existing,
    );
  }

  const filteredLeads = useMemo(() => filterLeads(localLeads, range), [localLeads, range]);
  const soldCount = filteredLeads.filter((lead) => lead.convertedToSale).length;
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const paginatedLeads = useMemo(
    () => filteredLeads.slice((page - 1) * pageSize, page * pageSize),
    [filteredLeads, page],
  );
  const chartData = useMemo(
    () => buildChartData(filteredLeads, granularity, locale),
    [filteredLeads, granularity, locale],
  );
  const chartMax = Math.max(...chartData.map((item) => item.total), 1);

  useEffect(() => {
    setPage(1);
  }, [range]);

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
          <CardDescription>{copy.empty}</CardDescription>
        </CardHeader>
      </Card>
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
              <div className="flex flex-wrap gap-2">
                {(["7d", "30d", "90d", "all"] as const).map((item) => (
                  <Button
                    key={item}
                    type="button"
                    size="sm"
                    variant={range === item ? "secondary" : "outline"}
                    onClick={() => setRange(item)}
                  >
                    {copy.filters[item]}
                  </Button>
                ))}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
                    {copy.totalRequests}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">{filteredLeads.length}</p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
                    {copy.soldRequests}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">{soldCount}</p>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
                    {copy.conversionRate}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-white">
                    {formatConversionRate(filteredLeads.length, soldCount)}
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm text-[var(--foreground-muted)]">
                {copy.summary(filteredLeads.length, soldCount)}
              </div>

              <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{copy.chartTitle}</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">{copy.chartDescription}</p>
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

                <div className="mt-5 space-y-4">
                  <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2 rounded-full bg-white" />
                      {copy.requests}
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[var(--accent)]" />
                      {copy.sold}
                    </span>
                  </div>

                  {chartData.length === 0 ? (
                    <p className="text-sm text-[var(--foreground-muted)]">{copy.empty}</p>
                  ) : (
                    <div className="grid h-56 grid-cols-[repeat(auto-fit,minmax(52px,1fr))] items-end gap-3">
                      {chartData.map((item) => (
                        <div key={item.label} className="flex min-w-0 flex-col items-center gap-2">
                          <div className="flex h-40 w-full items-end justify-center gap-1">
                            <div
                              className="w-3 rounded-t-full bg-white/85"
                              style={{ height: `${Math.max((item.total / chartMax) * 100, 8)}%` }}
                              title={`${copy.requests}: ${item.total}`}
                            />
                            <div
                              className="w-3 rounded-t-full bg-[var(--accent)]"
                              style={{ height: `${Math.max((item.sold / chartMax) * 100, item.sold ? 8 : 0)}%` }}
                              title={`${copy.sold}: ${item.sold}`}
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
          <div className="space-y-3 lg:hidden">
            {paginatedLeads.map((lead) => (
              <div key={lead.id} className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {formatDateLabel(lead.createdAt)}
                    </p>
                    <p className="mt-1 font-medium text-white">{formatIntent(lead.intent)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={lead.contacted ? "accent" : "muted"}>
                      {lead.contacted ? copy.contacted : copy.new}
                    </Badge>
                    <Badge variant={lead.convertedToSale ? "accent" : "muted"}>
                      {lead.convertedToSale ? copy.soldBadge : copy.unsoldBadge}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-[var(--foreground-muted)]">
                  <p>{copy.placement}: {getPlacementDetailLabel(lead.bodyAreaDetail)}</p>
                  <p>{copy.size}: {formatApproximateSizeLabel(lead) ?? lead.sizeCategory}</p>
                  <p>{copy.city}: {lead.city ?? copy.noCity}</p>
                  <p>{copy.style}: {formatStyle(lead.style)}</p>
                  <p>{copy.estimate}: {formatCompactCurrencyRange(lead.estimatedMin, lead.estimatedMax, currency)}</p>
                  <p>{copy.notes}: {notesPreview(lead.notes, copy.noNotes)}</p>
                </div>
                <Button
                  className="mt-4 w-full"
                  variant="secondary"
                  onClick={() => void updateLead(lead.id, { contacted: !lead.contacted }, { contacted: !lead.contacted })}
                >
                  {lead.contacted ? copy.markNotContacted : copy.markContacted}
                </Button>
                <Button
                  className="mt-2 w-full"
                  variant="outline"
                  onClick={() =>
                    void updateLead(
                      lead.id,
                      { convertedToSale: !lead.convertedToSale },
                      {
                        convertedToSale: !lead.convertedToSale,
                        soldAt: !lead.convertedToSale ? new Date().toISOString() : null,
                      },
                    )
                  }
                >
                  <CheckCircle2 className="size-4" />
                  {lead.convertedToSale ? copy.markUnsold : copy.markSold}
                </Button>
                <Button className="mt-2 w-full" variant="outline" onClick={() => setSelectedLead(lead)}>
                  {copy.viewDetails}
                </Button>
              </div>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[24px] border border-white/8 lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.date}</TableHead>
                  <TableHead>{copy.intent}</TableHead>
                  <TableHead>{copy.placement}</TableHead>
                  <TableHead>{copy.style}</TableHead>
                  <TableHead>{copy.estimate}</TableHead>
                  <TableHead>{copy.notes}</TableHead>
                  <TableHead>{copy.status}</TableHead>
                </TableRow>
              </TableHeader>
                <TableBody>
                {paginatedLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{formatDateLabel(lead.createdAt)}</TableCell>
                    <TableCell>{formatIntent(lead.intent)}</TableCell>
                    <TableCell>{getPlacementDetailLabel(lead.bodyAreaDetail)}</TableCell>
                    <TableCell>{formatStyle(lead.style)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p>{formatCompactCurrencyRange(lead.estimatedMin, lead.estimatedMax, currency)}</p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {copy.size}: {formatApproximateSizeLabel(lead) ?? lead.sizeCategory}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{notesPreview(lead.notes, copy.noNotes)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={lead.contacted ? "outline" : "secondary"}
                          onClick={() =>
                            void updateLead(lead.id, { contacted: !lead.contacted }, { contacted: !lead.contacted })
                          }
                        >
                          {lead.contacted ? copy.contacted : copy.markContacted}
                        </Button>
                        <Button
                          size="sm"
                          variant={lead.convertedToSale ? "secondary" : "outline"}
                          onClick={() =>
                            void updateLead(
                              lead.id,
                              { convertedToSale: !lead.convertedToSale },
                              {
                                convertedToSale: !lead.convertedToSale,
                                soldAt: !lead.convertedToSale ? new Date().toISOString() : null,
                              },
                            )
                          }
                        >
                          {lead.convertedToSale ? copy.soldBadge : copy.markSold}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedLead(lead)}>
                          {copy.details}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 rounded-[24px] border border-white/8 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--foreground-muted)]">
              {copy.pageSummary(page, totalPages)}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                {copy.previous}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={page === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                {copy.next}
              </Button>
            </div>
          </div>

          {selectedLead ? (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
              <div className="w-full max-w-2xl rounded-[28px] border border-white/10 bg-[#0f0f11] p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {formatDateLabel(selectedLead.createdAt)}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {formatIntent(selectedLead.intent)}
                    </h3>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setSelectedLead(null)}>
                    <X className="size-4" />
                  </Button>
                </div>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div className="space-y-3 rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm text-[var(--foreground-muted)]">
                    <p><span className="text-white">{copy.placement}:</span> {getPlacementDetailLabel(selectedLead.bodyAreaDetail)}</p>
                    <p><span className="text-white">{copy.size}:</span> {formatApproximateSizeLabel(selectedLead) ?? selectedLead.sizeCategory}</p>
                    <p><span className="text-white">{copy.city}:</span> {selectedLead.city || copy.noCity}</p>
                    <p><span className="text-white">{copy.style}:</span> {formatStyle(selectedLead.style)}</p>
                    <p><span className="text-white">{copy.estimate}:</span> {formatCompactCurrencyRange(selectedLead.estimatedMin, selectedLead.estimatedMax, currency)}</p>
                    <p><span className="text-white">{copy.notes}:</span> {selectedLead.notes || copy.noNotes}</p>
                    <p><span className="text-white">Reference description:</span> {selectedLead.referenceDescription || copy.noReferenceDescription}</p>
                    <p>
                      <span className="text-white">Preferred timing:</span>{" "}
                      {selectedLead.preferredStartDate || selectedLead.preferredEndDate
                        ? `${selectedLead.preferredStartDate ?? "?"} - ${selectedLead.preferredEndDate ?? "?"}`
                        : copy.noTiming}
                    </p>
                    <p>
                      <span className="text-white">Selected design:</span>{" "}
                      {selectedLead.selectedDesignId
                        ? designs.find((design) => design.id === selectedLead.selectedDesignId)?.title ?? "Selected design"
                        : copy.noDesign}
                    </p>
                    <p>
                      <span className="text-white">{copy.soldAt}:</span>{" "}
                      {selectedLead.soldAt ? formatDateLabel(selectedLead.soldAt) : copy.unsoldBadge}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                      <p className="text-sm font-medium text-white">Reference image</p>
                      {selectedLead.referenceImageUrl ? (
                        <div className="mt-3 space-y-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={selectedLead.referenceImageUrl}
                            alt="Reference"
                            className="h-64 w-full rounded-[18px] object-cover"
                          />
                          <a
                            href={selectedLead.referenceImageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-[var(--accent-soft)] underline-offset-4 hover:underline"
                          >
                            {copy.openFullImage}
                          </a>
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-[var(--foreground-muted)]">
                          {copy.noReferenceImage}
                        </p>
                      )}
                    </div>
                    <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                      <p className="text-sm font-medium text-white">{copy.leadStatus}</p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Badge variant={selectedLead.contacted ? "accent" : "muted"}>
                          {selectedLead.contacted ? copy.contacted : copy.new}
                        </Badge>
                        <Badge variant={selectedLead.convertedToSale ? "accent" : "muted"}>
                          {selectedLead.convertedToSale ? copy.soldBadge : copy.unsoldBadge}
                        </Badge>
                        <Button
                          size="sm"
                          variant={selectedLead.contacted ? "outline" : "secondary"}
                          onClick={() =>
                            void updateLead(
                              selectedLead.id,
                              { contacted: !selectedLead.contacted },
                              { contacted: !selectedLead.contacted },
                            )
                          }
                        >
                          {selectedLead.contacted ? copy.markNotContacted : copy.markContacted}
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedLead.convertedToSale ? "secondary" : "outline"}
                          onClick={() =>
                            void updateLead(
                              selectedLead.id,
                              { convertedToSale: !selectedLead.convertedToSale },
                              {
                                convertedToSale: !selectedLead.convertedToSale,
                                soldAt: !selectedLead.convertedToSale ? new Date().toISOString() : null,
                              },
                            )
                          }
                        >
                          <TrendingUp className="size-4" />
                          {selectedLead.convertedToSale ? copy.markUnsold : copy.markSold}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
