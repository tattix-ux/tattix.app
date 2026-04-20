"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  ChevronDown,
  Copy,
  ImagePlus,
  LoaderCircle,
  MoreHorizontal,
  PencilLine,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { Field } from "@/components/shared/field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { featuredDesignCategories } from "@/lib/constants/options";
import { featuredDesignsSchema } from "@/lib/forms/schemas";
import type { PublicLocale } from "@/lib/i18n/public";
import { removeArtistAsset, uploadArtistAsset } from "@/lib/supabase/storage";
import type { ArtistFeaturedDesign } from "@/lib/types";
import { cn } from "@/lib/utils";

type FeaturedDesignFormInput = z.input<typeof featuredDesignsSchema>;
type FeaturedDesignValues = z.output<typeof featuredDesignsSchema>;
type DesignDraft = FeaturedDesignValues["designs"][number];
type PartialDesignDraft = {
  id?: string;
  category?: string | null;
  title?: string | null;
  shortDescription?: string | null;
  imageUrl?: string | null;
  imagePath?: string | null;
  priceNote?: string | null;
  referenceDetailLevel?: DesignDraft["referenceDetailLevel"] | null;
  referencePriceMin?: number | null;
  referencePriceMax?: number | null;
  referenceSizeCm?: number | null;
  referenceColorMode?: DesignDraft["referenceColorMode"] | null;
  pricingMode?: DesignDraft["pricingMode"] | null;
  colorImpactPreference?: DesignDraft["colorImpactPreference"] | null;
  active?: boolean | null;
  sortOrder?: unknown;
};
type PricingModeValue = NonNullable<DesignDraft["pricingMode"]>;
type ColorModeValue = NonNullable<DesignDraft["referenceColorMode"]>;
type ColorImpactValue = NonNullable<DesignDraft["colorImpactPreference"]>;

function EditorSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-[24px] border border-white/8 bg-white/[0.025] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold tracking-[-0.02em] text-white">{title}</h3>
        {description ? (
          <p className="text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground-muted)_82%,white_8%)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function CollapsibleSection({
  title,
  description,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string;
  description?: string;
  summary?: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-white/8 bg-white/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="space-y-1">
          <p className="text-base font-semibold tracking-[-0.02em] text-white">{title}</p>
          {description ? (
            <p className="text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground-muted)_82%,white_8%)]">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          {summary ? (
            <span className="text-xs text-[color:color-mix(in_srgb,var(--foreground-muted)_76%,white_10%)]">
              {summary}
            </span>
          ) : null}
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-[var(--foreground-muted)] transition",
              open ? "rotate-180 text-white/80" : "",
            )}
          />
        </div>
      </button>
      {open ? <div className="border-t border-white/7 px-5 py-4">{children}</div> : null}
    </section>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[18px] border px-4 py-3 text-sm font-medium transition",
              selected
                ? "border-[var(--accent)]/40 bg-[var(--accent)]/14 text-[var(--accent-soft)] shadow-[0_10px_24px_rgba(0,0,0,0.16)]"
                : "border-white/8 bg-white/[0.03] text-[color:color-mix(in_srgb,var(--foreground-muted)_84%,white_10%)] hover:border-white/12 hover:bg-white/[0.05] hover:text-white/92",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const copy = {
  en: {
    uploadUnavailable: "Image upload is unavailable in demo mode.",
    invalidType: "Only image files are allowed.",
    invalidSize: "Image files must be 6 MB or smaller.",
    uploaded: "Image uploaded.",
    uploadFailed: "Unable to upload image.",
    saveFailed: "Unable to save designs.",
    saved: "Saved",
    introDescription:
      "These designs appear on your profile page. Clients can send a request from the design they like.",
    introHint: "To add a new design, image, name, size, and price are enough.",
    introSteps: ["Upload image", "Name it", "Set price"],
    addDesign: "Add new design",
    emptyTitle: "Add your first design",
    emptyDescription: "Start with an image, a name, and an approximate price.",
    item: "Design",
    newItem: "New design",
    edit: "Edit",
    duplicate: "Duplicate",
    remove: "Delete",
    removeConfirm: "Delete this design?",
    liveOn: "Live",
    liveOff: "Draft",
    image: "Design image",
    noImage: "No image yet",
    uploadImage: "Upload image",
    replaceImage: "Change image",
    removeImage: "Remove",
    detailsTitle: "Required info",
    detailsDescription: "These are enough to get started.",
    titleLabel: "Design name",
    titlePlaceholder: "e.g. Fine line rose",
    sizeLabel: "Approximate size",
    sizePlaceholder: "10",
    priceLabel: "Price shown to clients",
    priceHelp: "An approximate range is shown.",
    priceMin: "Lower price",
    priceMax: "Upper price",
    optionalTitle: "Extra info (optional)",
    optionalDescription: "If you want, you can add a short note and a category.",
    optionalSummary: "Can be left blank",
    category: "Category (optional)",
    customCategory: "Custom category",
    customCategoryPlaceholder: "e.g. Floral",
    shortDescription: "Short note (optional)",
    shortDescriptionHelp: "If you want, you can show a short explanation to clients.",
    shortDescriptionPlaceholder:
      "e.g. Fine line piece. Looks good on the forearm and upper arm.",
    advancedTitle: "Advanced pricing settings",
    advancedDescription: "Open this only if this design should behave differently from your general pricing.",
    advancedSummaryDefault: "Using general pricing settings",
    advancedSummaryCustom: "Custom pricing active",
    useGeneralPricing: "Use general pricing settings",
    useGeneralPricingHelp: "Most designs do not need this changed.",
    advancedSize: "What size is this price for?",
    advancedSizeHelp: "e.g. 10 cm",
    advancedPricingMode: "Should the price increase when size grows?",
    advancedColorMode: "Which color setup is this price for?",
    advancedColorImpact: "Should the price increase for color work?",
    advancedDefaultNote: "You usually do not need to change this for most designs.",
    statusLabel: "Show on your profile page",
    statusHelp: "When on, clients can see it.",
    drawerTitle: "Edit design",
    save: "Save",
    saving: "Saving",
    cancel: "Cancel",
    flash: "Flash design",
    discounted: "Discounted design",
    customOption: "Custom category",
    pricingModes: {
      fixed_range: "Stay fixed",
      size_adjusted: "Increase a bit",
      size_and_placement_adjusted: "Follow size",
      starting_from: "Starting from",
    },
    referenceColorModes: {
      "black-only": "Black only",
      "black-grey": "Black-grey",
      "full-color": "Color",
    },
    colorImpactOptions: {
      low: "No change",
      medium: "Increase a bit",
      high: "Increase clearly",
    },
  },
  tr: {
    uploadUnavailable: "Demo modunda görsel yükleme kullanılamıyor.",
    invalidType: "Yalnızca görsel dosyaları yükleyebilirsin.",
    invalidSize: "Görseller en fazla 6 MB olabilir.",
    uploaded: "Görsel yüklendi.",
    uploadFailed: "Görsel yüklenemedi.",
    saveFailed: "Tasarım kaydedilemedi.",
    saved: "Kaydedildi",
    introDescription:
      "Buradaki tasarımlar profil sayfanda görünür. Müşteri beğendiği tasarımdan talep gönderebilir.",
    introHint: "Yeni tasarım eklemek için görsel, ad, boyut ve fiyat yeterli.",
    introSteps: ["Görsel yükle", "Ad ver", "Fiyat gir"],
    addDesign: "Yeni tasarım ekle",
    emptyTitle: "İlk tasarımını ekle",
    emptyDescription: "Görsel, ad ve yaklaşık fiyat girerek başlayabilirsin.",
    item: "Tasarım",
    newItem: "Yeni tasarım",
    edit: "Düzenle",
    duplicate: "Çoğalt",
    remove: "Sil",
    removeConfirm: "Bu tasarımı silmek istiyor musun?",
    liveOn: "Yayında",
    liveOff: "Taslak",
    image: "Tasarım görseli",
    noImage: "Henüz görsel yok",
    uploadImage: "Görsel yükle",
    replaceImage: "Görsel değiştir",
    removeImage: "Kaldır",
    detailsTitle: "Gerekli bilgiler",
    detailsDescription: "Başlamak için bu alanlar yeterli.",
    titleLabel: "Tasarım adı",
    titlePlaceholder: "Örn: Minimal gül",
    sizeLabel: "Yaklaşık boyut",
    sizePlaceholder: "10",
    priceLabel: "Müşteriye gösterilecek fiyat",
    priceHelp: "Yaklaşık fiyat aralığı gösterilir.",
    priceMin: "Alt fiyat",
    priceMax: "Üst fiyat",
    optionalTitle: "Ek bilgiler (opsiyonel)",
    optionalDescription: "İstersen kısa not ve kategori ekleyebilirsin.",
    optionalSummary: "Boş bırakılabilir",
    category: "Kategori (opsiyonel)",
    customCategory: "Özel kategori",
    customCategoryPlaceholder: "Örn: Floral",
    shortDescription: "Kısa not (opsiyonel)",
    shortDescriptionHelp: "İstersen müşteriye kısa bir açıklama gösterebilirsin.",
    shortDescriptionPlaceholder:
      "Örn: İnce çizgi çalışılır. Ön kol ve üst kolda iyi durur.",
    advancedTitle: "Gelişmiş fiyat ayarları",
    advancedDescription: "Sadece bu tasarım genel ayarlardan farklı olsun istiyorsan aç.",
    advancedSummaryDefault: "Şu an genel fiyat ayarlarını kullanıyor",
    advancedSummaryCustom: "Özel fiyat ayarları açık",
    useGeneralPricing: "Genel fiyat ayarlarını kullan",
    useGeneralPricingHelp: "Çoğu tasarım için bunu değiştirmene gerek yok.",
    advancedSize: "Bu fiyat hangi boyut için?",
    advancedSizeHelp: "Örn: 10 cm",
    advancedPricingMode: "Boyut büyürse fiyat artsın mı?",
    advancedColorMode: "Bu fiyat hangi renk düzeni için?",
    advancedColorImpact: "Renkli çalışmada fiyat artsın mı?",
    advancedDefaultNote: "Çoğu tasarım için bunu değiştirmen gerekmez.",
    statusLabel: "Profil sayfanda göster",
    statusHelp: "Açık olduğunda müşteri görür.",
    drawerTitle: "Tasarımı düzenle",
    save: "Kaydet",
    saving: "Kaydediliyor",
    cancel: "Vazgeç",
    flash: "Flash tasarım",
    discounted: "İndirimli tasarım",
    customOption: "Özel kategori",
    pricingModes: {
      fixed_range: "Sabit kalsın",
      size_adjusted: "Biraz artsın",
      size_and_placement_adjusted: "Boyuta göre hesaplansın",
      starting_from: "Başlangıç fiyatı",
    },
    referenceColorModes: {
      "black-only": "Sadece siyah",
      "black-grey": "Siyah-gri",
      "full-color": "Renkli",
    },
    colorImpactOptions: {
      low: "Değişmesin",
      medium: "Biraz artsın",
      high: "Belirgin artsın",
    },
  },
} as const;

const DEFAULT_PRICING_MODE: PricingModeValue = "size_adjusted";
const DEFAULT_COLOR_MODE: ColorModeValue = "black-only";
const DEFAULT_COLOR_IMPACT: ColorImpactValue = "medium";

function createEmptyDesign(sortOrder: number): DesignDraft {
  return {
    id: crypto.randomUUID(),
    category: "flash-designs",
    title: "",
    shortDescription: "",
    imageUrl: "",
    imagePath: "",
    priceNote: "",
    referenceDetailLevel: null,
    referencePriceMin: null,
    referencePriceMax: null,
    referenceSizeCm: 10,
    referenceColorMode: DEFAULT_COLOR_MODE,
    pricingMode: DEFAULT_PRICING_MODE,
    colorImpactPreference: DEFAULT_COLOR_IMPACT,
    active: false,
    sortOrder,
  };
}

function normalizeDesign(design: PartialDesignDraft, sortOrder: number): DesignDraft {
  return {
    id: design.id ?? crypto.randomUUID(),
    category: design.category ?? "flash-designs",
    title: design.title ?? "",
    shortDescription: design.shortDescription ?? "",
    imageUrl: design.imageUrl ?? "",
    imagePath: design.imagePath ?? "",
    priceNote: design.priceNote ?? "",
    referenceDetailLevel: design.referenceDetailLevel ?? null,
    referencePriceMin: design.referencePriceMin ?? null,
    referencePriceMax: design.referencePriceMax ?? null,
    referenceSizeCm: design.referenceSizeCm ?? 10,
    referenceColorMode: design.referenceColorMode ?? DEFAULT_COLOR_MODE,
    pricingMode: design.pricingMode ?? DEFAULT_PRICING_MODE,
    colorImpactPreference: design.colorImpactPreference ?? DEFAULT_COLOR_IMPACT,
    active: design.active ?? false,
    sortOrder,
  };
}

function cloneDesign(design: PartialDesignDraft, sortOrder: number): DesignDraft {
  const normalized = normalizeDesign(design, sortOrder);

  return {
    ...normalized,
    id: crypto.randomUUID(),
    title: normalized.title ? `${normalized.title} kopya` : "",
    active: false,
    sortOrder,
  };
}

function formatCurrency(locale: PublicLocale, value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  const formatted = new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US").format(value);
  return locale === "tr" ? `₺${formatted}` : `TRY ${formatted}`;
}

function toNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function isUsingGeneralPricing(design: PartialDesignDraft | null | undefined) {
  if (!design) {
    return true;
  }

  return (
    (design.pricingMode ?? DEFAULT_PRICING_MODE) === DEFAULT_PRICING_MODE &&
    (design.referenceColorMode ?? DEFAULT_COLOR_MODE) === DEFAULT_COLOR_MODE &&
    (design.colorImpactPreference ?? DEFAULT_COLOR_IMPACT) === DEFAULT_COLOR_IMPACT
  );
}

export function FeaturedDesignsForm({
  designs,
  artistId,
  demoMode,
  locale = "en",
}: {
  designs: ArtistFeaturedDesign[];
  artistId: string;
  demoMode: boolean;
  locale?: PublicLocale;
}) {
  const labels = copy[locale];
  const form = useForm<FeaturedDesignFormInput, unknown, FeaturedDesignValues>({
    resolver: zodResolver(featuredDesignsSchema),
    defaultValues: {
      designs: designs.map((design) => ({
        id: design.id,
        category: design.category,
        title: design.title,
        shortDescription: design.shortDescription,
        imageUrl: design.imageUrl ?? "",
        imagePath: design.imagePath ?? "",
        priceNote: design.priceNote ?? "",
        referenceDetailLevel: design.referenceDetailLevel ?? null,
        referencePriceMin: design.referencePriceMin,
        referencePriceMax: design.referencePriceMax,
        referenceSizeCm: design.referenceSizeCm,
        referenceColorMode: design.referenceColorMode ?? DEFAULT_COLOR_MODE,
        pricingMode: design.pricingMode ?? DEFAULT_PRICING_MODE,
        colorImpactPreference: design.colorImpactPreference ?? DEFAULT_COLOR_IMPACT,
        active: design.active,
        sortOrder: design.sortOrder,
      })),
    } satisfies FeaturedDesignFormInput,
  });

  const designsFieldArray = useFieldArray({
    control: form.control,
    name: "designs",
  });
  const watchedDesigns = useWatch({
    control: form.control,
    name: "designs",
    defaultValue: form.getValues("designs"),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingOpenMode, setPendingOpenMode] = useState<"new" | "duplicate" | null>(null);
  const [optionalOpen, setOptionalOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [useGeneralPricing, setUseGeneralPricing] = useState(true);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const editingIndex = editingId
    ? designsFieldArray.fields.findIndex((field) => field.id === editingId)
    : -1;
  const editingDesign = editingIndex >= 0 ? watchedDesigns?.[editingIndex] : null;

  useEffect(() => {
    if (!pendingOpenMode) {
      return;
    }

    const latestField = designsFieldArray.fields.at(-1);
    if (!latestField) {
      return;
    }

    setEditingId(latestField.id);
    setPendingOpenMode(null);
  }, [designsFieldArray.fields, pendingOpenMode]);

  useEffect(() => {
    if (!editingDesign) {
      setOptionalOpen(false);
      setAdvancedOpen(false);
      setUseGeneralPricing(true);
      return;
    }

    setOptionalOpen(Boolean(editingDesign.shortDescription?.trim()) || !featuredDesignCategories.some((item) => item.value === editingDesign.category));
    setAdvancedOpen(false);
    setUseGeneralPricing(isUsingGeneralPricing(editingDesign as PartialDesignDraft));
  }, [editingDesign?.id]);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setFlashMessage(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [flashMessage]);

  function getCategorySelectValue(category: string) {
    return featuredDesignCategories.some((item) => item.value === category) ? category : "__custom__";
  }

  function getCategoryLabel(category: string) {
    if (category === "flash-designs") {
      return labels.flash;
    }

    if (category === "discounted-designs") {
      return labels.discounted;
    }

    return category;
  }

  async function handleImageUpload(index: number, file: File) {
    if (demoMode) {
      form.setError("root", { message: labels.uploadUnavailable });
      return;
    }

    if (!file.type.startsWith("image/")) {
      form.setError("root", { message: labels.invalidType });
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      form.setError("root", { message: labels.invalidSize });
      return;
    }

    const previousPath = form.getValues(`designs.${index}.imagePath`) || "";

    try {
      const uploaded = await uploadArtistAsset(file, {
        artistId,
        bucket: "artist-designs",
        prefix: "featured-design",
      });

      if (previousPath) {
        const duplicateUseCount = (form.getValues("designs") ?? []).filter(
          (design) => design.imagePath?.trim() === previousPath,
        ).length;

        if (duplicateUseCount <= 1) {
          await removeArtistAsset(previousPath, { bucket: "artist-designs" }).catch(() => undefined);
        }
      }

      form.setValue(`designs.${index}.imageUrl`, uploaded.publicUrl, { shouldDirty: true });
      form.setValue(`designs.${index}.imagePath`, uploaded.path, { shouldDirty: true });
      form.clearErrors("root");
      setFlashMessage(labels.uploaded);
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : labels.uploadFailed,
      });
    }
  }

  async function handleImageRemove(index: number) {
    const existingPath = form.getValues(`designs.${index}.imagePath`) || "";

    if (existingPath && !demoMode) {
      const duplicateUseCount = (form.getValues("designs") ?? []).filter(
        (design) => design.imagePath?.trim() === existingPath,
      ).length;

      if (duplicateUseCount <= 1) {
        await removeArtistAsset(existingPath, { bucket: "artist-designs" }).catch(() => undefined);
      }
    }

    form.setValue(`designs.${index}.imageUrl`, "", { shouldDirty: true });
    form.setValue(`designs.${index}.imagePath`, "", { shouldDirty: true });
  }

  function handleRemove(index: number) {
    if (typeof window !== "undefined" && !window.confirm(labels.removeConfirm)) {
      return;
    }

    const currentId = designsFieldArray.fields[index]?.id;
    designsFieldArray.remove(index);

    if (currentId && currentId === editingId) {
      setEditingId(null);
    }
  }

  async function onSubmit(values: FeaturedDesignValues) {
    const response = await fetch("/api/dashboard/designs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    await response.json().catch(() => null);

    if (!response.ok) {
      form.setError("root", { message: labels.saveFailed });
      return;
    }

    form.reset(values);
    form.clearErrors("root");
    setFlashMessage(labels.saved);
  }

  const statusMessage = form.formState.errors.root?.message ?? null;

  return (
    <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
      {flashMessage ? (
        <div className="fixed right-5 top-5 z-[70] rounded-full border border-[var(--accent)]/20 bg-[color:color-mix(in_srgb,var(--background)_82%,black_18%)] px-4 py-2 text-sm text-[var(--accent-soft)] shadow-[0_18px_36px_rgba(0,0,0,0.28)]">
          {flashMessage}
        </div>
      ) : null}
      <Card className="surface-border overflow-hidden border-white/8 bg-[color:color-mix(in_srgb,var(--background)_93%,white_3%)] shadow-[0_18px_46px_rgba(0,0,0,0.16)]">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0 space-y-2">
            <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_84%,white_8%)]">
              {labels.introHint}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {labels.introSteps.map((step) => (
                <span
                  key={step}
                  className="rounded-full border border-white/8 bg-white/[0.02] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[color:color-mix(in_srgb,var(--foreground-muted)_76%,white_10%)]"
                >
                  {step}
                </span>
              ))}
            </div>
            {statusMessage && !editingDesign ? <p className="text-sm text-red-300">{statusMessage}</p> : null}
          </div>

          <div className="shrink-0">
            <Button
              type="button"
              onClick={() => {
                designsFieldArray.append(createEmptyDesign(designsFieldArray.fields.length));
                setPendingOpenMode("new");
              }}
            >
              <Plus className="size-4" />
              {labels.addDesign}
            </Button>
          </div>
        </CardContent>
      </Card>

      {designsFieldArray.fields.length === 0 ? (
        <Card className="surface-border border-white/8 bg-[color:color-mix(in_srgb,var(--background)_93%,white_3%)] shadow-[0_18px_42px_rgba(0,0,0,0.14)]">
          <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
            <div className="rounded-full border border-white/10 bg-white/[0.03] p-4 text-[var(--foreground-muted)]">
              <ImagePlus className="size-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-[-0.02em] text-white">{labels.emptyTitle}</h3>
              <p className="max-w-[34ch] text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground-muted)_82%,white_8%)]">
                {labels.emptyDescription}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                designsFieldArray.append(createEmptyDesign(0));
                setPendingOpenMode("new");
              }}
            >
              <Plus className="size-4" />
              {labels.addDesign}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {designsFieldArray.fields.map((field, index) => {
            const design = watchedDesigns?.[index];
            const title = design?.title?.trim() || `${labels.newItem} ${index + 1}`;
            const category = getCategoryLabel(design?.category || "flash-designs");
            const sizeValue = toNullableNumber(design?.referenceSizeCm);
            const size = sizeValue ? `${sizeValue} cm` : null;
            const min = formatCurrency(locale, toNullableNumber(design?.referencePriceMin));
            const max = formatCurrency(locale, toNullableNumber(design?.referencePriceMax));
            const priceText = min && max ? `${min} – ${max}` : min ?? max ?? "—";
            const metaText = [category, size].filter(Boolean).join(" • ");
            const isEditing = editingId === field.id;

            return (
              <Card
                key={field.id}
                role="button"
                tabIndex={0}
                onClick={() => setEditingId(field.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setEditingId(field.id);
                  }
                }}
                className={cn(
                  "surface-border border-white/8 bg-[color:color-mix(in_srgb,var(--background)_93%,white_3%)] shadow-[0_14px_32px_rgba(0,0,0,0.1)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/35",
                  isEditing ? "border-[var(--accent)]/24 shadow-[0_18px_42px_rgba(0,0,0,0.16)]" : "",
                )}
              >
                <CardContent className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
                  <button
                    type="button"
                    onClick={() => setEditingId(field.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-[16px] border border-white/8 bg-white/[0.03]">
                      {design?.imageUrl ? (
                        <img
                          src={design.imageUrl}
                          alt={design.title || title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--foreground-muted)]">
                          <ImagePlus className="size-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-2">
                      <div className="space-y-1">
                        <p className="truncate text-[1.02rem] font-semibold tracking-[-0.02em] text-white">
                          {title}
                        </p>
                        <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_82%,white_10%)]">
                          {metaText || "—"}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/88">
                          {priceText}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                            design?.active
                              ? "border-[var(--accent)]/22 bg-[var(--accent)]/10 text-[var(--accent-soft)]"
                              : "border-white/8 bg-white/[0.03] text-[color:color-mix(in_srgb,var(--foreground-muted)_80%,white_10%)]",
                          )}
                        >
                          {design?.active ? labels.liveOn : labels.liveOff}
                        </span>
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 sm:shrink-0" onClick={(event) => event.stopPropagation()}>
                    <Button type="button" variant="secondary" onClick={() => setEditingId(field.id)}>
                      <PencilLine className="size-4" />
                      {labels.edit}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-white/82 hover:text-white"
                      onClick={(event) => {
                        event.stopPropagation();
                        designsFieldArray.append(
                          cloneDesign(
                            form.getValues(`designs.${index}`) as PartialDesignDraft,
                            designsFieldArray.fields.length,
                          ),
                        );
                        setPendingOpenMode("duplicate");
                      }}
                    >
                      <Copy className="size-4" />
                      {labels.duplicate}
                    </Button>
                    <details
                      className="relative [&_summary::-webkit-details-marker]:hidden"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <summary
                        aria-label={labels.remove}
                        className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-[var(--foreground-muted)] transition hover:border-white/12 hover:bg-white/[0.05] hover:text-white"
                      >
                        <MoreHorizontal className="size-4" />
                      </summary>
                      <div className="absolute right-0 top-[calc(100%+8px)] z-20 min-w-[140px] rounded-[18px] border border-white/10 bg-[color:color-mix(in_srgb,var(--background)_92%,black_8%)] p-1.5 shadow-[0_18px_32px_rgba(0,0,0,0.26)]">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-[14px] px-3 py-2 text-sm text-red-200 transition hover:bg-white/[0.05] hover:text-red-100"
                          onClick={() => handleRemove(index)}
                        >
                          <Trash2 className="size-4" />
                          {labels.remove}
                        </button>
                      </div>
                    </details>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {editingDesign ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm"
            onClick={() => setEditingId(null)}
          />
          <aside className="fixed inset-0 z-50 sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[min(560px,100vw)]">
            <div className="flex h-full flex-col bg-[color:color-mix(in_srgb,var(--background)_96%,black_6%)] sm:border-l sm:border-white/8 sm:shadow-[-24px_0_48px_rgba(0,0,0,0.28)]">
              <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-5 sm:px-6">
                <div className="min-w-0 space-y-1.5">
                  <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_80%,white_8%)]">
                    {labels.drawerTitle}
                  </p>
                  <h3 className="truncate text-xl font-semibold tracking-[-0.02em] text-white">
                    {editingDesign.title?.trim() || labels.newItem}
                  </h3>
                </div>

                <div className="flex items-start gap-4">
                  <div className="space-y-1 text-right">
                    <p className="text-sm font-medium text-white">{labels.statusLabel}</p>
                    <p className="text-xs text-[color:color-mix(in_srgb,var(--foreground-muted)_78%,white_8%)]">
                      {labels.statusHelp}
                    </p>
                  </div>
                  <label className="relative mt-0.5 inline-flex items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      {...form.register(`designs.${editingIndex}.active`)}
                    />
                    <span className="h-7 w-12 rounded-full bg-white/10 transition peer-checked:bg-[var(--accent)]/35" />
                    <span className="pointer-events-none absolute left-1 size-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5 peer-checked:bg-[var(--accent)]" />
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={labels.cancel}
                    onClick={() => setEditingId(null)}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                <div className="space-y-4">
                  <input type="hidden" {...form.register(`designs.${editingIndex}.id`)} />
                  <input type="hidden" {...form.register(`designs.${editingIndex}.imagePath`)} />
                  <input type="hidden" {...form.register(`designs.${editingIndex}.imageUrl`)} />

                  <EditorSection title={labels.detailsTitle} description={labels.detailsDescription}>
                    <div className="space-y-4">
                      <Field label={labels.image}>
                        <div className="space-y-3">
                          <div className="relative flex h-[176px] items-center justify-center overflow-hidden rounded-[20px] border border-white/8 bg-white/[0.03]">
                            {editingDesign.imageUrl ? (
                              <img
                                src={editingDesign.imageUrl}
                                alt={editingDesign.title || labels.newItem}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="space-y-2 text-center text-[var(--foreground-muted)]">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
                                  <ImagePlus className="size-5" />
                                </div>
                                <p className="text-xs text-[color:color-mix(in_srgb,var(--foreground-muted)_78%,white_10%)]">
                                  {labels.noImage}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white transition hover:bg-white/[0.06]">
                              <Upload className="size-4" />
                              {editingDesign.imageUrl ? labels.replaceImage : labels.uploadImage}
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0];
                                  if (file) {
                                    void handleImageUpload(editingIndex, file);
                                  }
                                  event.currentTarget.value = "";
                                }}
                              />
                            </label>
                            {editingDesign.imageUrl ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-white/74 hover:text-white"
                                onClick={() => void handleImageRemove(editingIndex)}
                              >
                                <X className="size-4" />
                                {labels.removeImage}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </Field>

                      <Field
                        label={labels.titleLabel}
                        error={form.formState.errors.designs?.[editingIndex]?.title?.message}
                      >
                        <Input
                          className="h-12 rounded-[18px] bg-white/[0.03]"
                          placeholder={labels.titlePlaceholder}
                          {...form.register(`designs.${editingIndex}.title`)}
                        />
                      </Field>

                      <Field
                        label={labels.sizeLabel}
                        error={form.formState.errors.designs?.[editingIndex]?.referenceSizeCm?.message}
                      >
                        <div className="relative">
                          <Input
                            type="number"
                            className="h-12 rounded-[18px] bg-white/[0.03] pr-12"
                            placeholder={labels.sizePlaceholder}
                            {...form.register(`designs.${editingIndex}.referenceSizeCm`)}
                          />
                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_76%,white_10%)]">
                            cm
                          </span>
                        </div>
                      </Field>

                      <Field label={labels.priceLabel} description={labels.priceHelp}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field
                            label={labels.priceMin}
                            className="gap-2"
                            error={form.formState.errors.designs?.[editingIndex]?.referencePriceMin?.message}
                          >
                            <Input
                              type="number"
                              className="h-12 rounded-[18px] bg-white/[0.03]"
                              placeholder="6000"
                              {...form.register(`designs.${editingIndex}.referencePriceMin`)}
                            />
                          </Field>
                          <Field
                            label={labels.priceMax}
                            className="gap-2"
                            error={form.formState.errors.designs?.[editingIndex]?.referencePriceMax?.message}
                          >
                            <Input
                              type="number"
                              className="h-12 rounded-[18px] bg-white/[0.03]"
                              placeholder="8500"
                              {...form.register(`designs.${editingIndex}.referencePriceMax`)}
                            />
                          </Field>
                        </div>
                      </Field>
                    </div>
                  </EditorSection>

                  <CollapsibleSection
                    title={labels.optionalTitle}
                    description={labels.optionalDescription}
                    summary={optionalOpen ? undefined : labels.optionalSummary}
                    open={optionalOpen}
                    onToggle={() => setOptionalOpen((current) => !current)}
                  >
                    <div className="space-y-4">
                      <Field label={labels.category}>
                        <NativeSelect
                          className="h-12 rounded-[18px] bg-white/[0.03]"
                          value={getCategorySelectValue(editingDesign.category || "")}
                          onChange={(event) =>
                            form.setValue(
                              `designs.${editingIndex}.category`,
                              event.target.value === "__custom__" ? "" : event.target.value,
                              { shouldDirty: true, shouldValidate: true },
                            )
                          }
                        >
                          <option value="flash-designs">{labels.flash}</option>
                          <option value="discounted-designs">{labels.discounted}</option>
                          <option value="__custom__">{labels.customOption}</option>
                        </NativeSelect>
                      </Field>

                      {getCategorySelectValue(editingDesign.category || "") === "__custom__" ? (
                        <Field label={labels.customCategory}>
                          <Input
                            className="h-12 rounded-[18px] bg-white/[0.03]"
                            placeholder={labels.customCategoryPlaceholder}
                            value={editingDesign.category || ""}
                            onChange={(event) =>
                              form.setValue(`designs.${editingIndex}.category`, event.target.value, {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                          />
                        </Field>
                      ) : null}

                      <Field label={labels.shortDescription} description={labels.shortDescriptionHelp}>
                        <Textarea
                          className="min-h-[132px] rounded-[18px] bg-white/[0.03]"
                          placeholder={labels.shortDescriptionPlaceholder}
                          {...form.register(`designs.${editingIndex}.shortDescription`)}
                        />
                      </Field>
                    </div>
                  </CollapsibleSection>

                  <CollapsibleSection
                    title={labels.advancedTitle}
                    description={labels.advancedDescription}
                    summary={
                      advancedOpen
                        ? undefined
                        : useGeneralPricing
                          ? labels.advancedSummaryDefault
                          : labels.advancedSummaryCustom
                    }
                    open={advancedOpen}
                    onToggle={() => setAdvancedOpen((current) => !current)}
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4 rounded-[18px] border border-white/8 bg-white/[0.03] px-4 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-white">{labels.useGeneralPricing}</p>
                          <p className="text-xs leading-5 text-[color:color-mix(in_srgb,var(--foreground-muted)_78%,white_10%)]">
                            {labels.useGeneralPricingHelp}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={useGeneralPricing}
                            onChange={(event) => {
                              const checked = event.target.checked;
                              setUseGeneralPricing(checked);

                              if (checked) {
                                form.setValue(`designs.${editingIndex}.pricingMode`, DEFAULT_PRICING_MODE, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                });
                                form.setValue(
                                  `designs.${editingIndex}.referenceColorMode`,
                                  DEFAULT_COLOR_MODE,
                                  { shouldDirty: true, shouldValidate: true },
                                );
                                form.setValue(
                                  `designs.${editingIndex}.colorImpactPreference`,
                                  DEFAULT_COLOR_IMPACT,
                                  { shouldDirty: true, shouldValidate: true },
                                );
                              }
                            }}
                            className="peer sr-only"
                          />
                          <span className="h-7 w-12 rounded-full bg-white/10 transition peer-checked:bg-[var(--accent)]/35" />
                          <span className="pointer-events-none absolute left-1 size-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5 peer-checked:bg-[var(--accent)]" />
                        </label>
                      </div>

                      {!useGeneralPricing ? (
                        <div className="space-y-4">
                          <Field label={labels.advancedSize} description={labels.advancedSizeHelp}>
                            <div className="relative">
                              <Input
                                type="number"
                                className="h-12 rounded-[18px] bg-white/[0.03] pr-12"
                                placeholder={labels.sizePlaceholder}
                                {...form.register(`designs.${editingIndex}.referenceSizeCm`)}
                              />
                              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_76%,white_10%)]">
                                cm
                              </span>
                            </div>
                          </Field>

                          <Field label={labels.advancedPricingMode}>
                            <SegmentedControl<PricingModeValue>
                              value={(editingDesign.pricingMode ?? DEFAULT_PRICING_MODE) as PricingModeValue}
                              options={[
                                { value: "fixed_range", label: labels.pricingModes.fixed_range },
                                { value: "size_adjusted", label: labels.pricingModes.size_adjusted },
                                {
                                  value: "size_and_placement_adjusted",
                                  label: labels.pricingModes.size_and_placement_adjusted,
                                },
                              ]}
                              onChange={(value) =>
                                form.setValue(`designs.${editingIndex}.pricingMode`, value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            />
                          </Field>

                          <Field label={labels.advancedColorMode}>
                            <SegmentedControl<ColorModeValue>
                              value={(editingDesign.referenceColorMode ?? DEFAULT_COLOR_MODE) as ColorModeValue}
                              options={[
                                { value: "black-only", label: labels.referenceColorModes["black-only"] },
                                { value: "black-grey", label: labels.referenceColorModes["black-grey"] },
                                { value: "full-color", label: labels.referenceColorModes["full-color"] },
                              ]}
                              onChange={(value) =>
                                form.setValue(`designs.${editingIndex}.referenceColorMode`, value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            />
                          </Field>

                          <Field label={labels.advancedColorImpact}>
                            <SegmentedControl<ColorImpactValue>
                              value={
                                (editingDesign.colorImpactPreference ?? DEFAULT_COLOR_IMPACT) as ColorImpactValue
                              }
                              options={[
                                { value: "low", label: labels.colorImpactOptions.low },
                                { value: "medium", label: labels.colorImpactOptions.medium },
                                { value: "high", label: labels.colorImpactOptions.high },
                              ]}
                              onChange={(value) =>
                                form.setValue(`designs.${editingIndex}.colorImpactPreference`, value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            />
                          </Field>
                        </div>
                      ) : (
                        <p className="text-sm text-[color:color-mix(in_srgb,var(--foreground-muted)_82%,white_8%)]">
                          {labels.advancedDefaultNote}
                        </p>
                      )}
                    </div>
                  </CollapsibleSection>
                </div>
              </div>

              <div className="border-t border-white/8 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {statusMessage ? <p className="text-sm text-red-300">{statusMessage}</p> : <span />}
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                      {labels.cancel}
                    </Button>
                    <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                      {form.formState.isSubmitting ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          {labels.saving}
                        </>
                      ) : (
                        <>
                          <Save className="size-4" />
                          {labels.save}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </form>
  );
}
