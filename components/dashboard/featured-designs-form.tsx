"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  Copy,
  ImagePlus,
  LoaderCircle,
  PencilLine,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";

import { BrandMonogram } from "@/components/shared/logo";
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
type PendingRemoval = { designId: string; title: string } | null;
type PendingOpenState = {
  designId: string;
  isNew: boolean;
  focusTitle: boolean;
  imageFile?: File | null;
} | null;
type EditingSnapshot = {
  designId: string;
  values: DesignDraft;
  isNew: boolean;
};

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
    <section className="space-y-1.5 rounded-[15px] border border-white/8 bg-white/[0.025] p-2.5 xl:p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <div className="space-y-1">
        <h3 className="text-[13px] font-semibold tracking-[-0.02em] text-white">{title}</h3>
        {description ? (
          <p className="text-[10.5px] leading-[1.35] text-[color:color-mix(in_srgb,var(--foreground-muted)_82%,white_8%)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
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
    introHint: "Upload the image, design name, and price range in one quick step.",
    introSteps: ["Upload image", "Add design name", "Set price range"],
    addDesign: "Add new design",
    emptyTitle: "Add your first design",
    emptyDescription: "Start with an image, a name, and an approximate price.",
    item: "Design",
    newItem: "New design",
    edit: "Edit",
    duplicate: "Duplicate",
    remove: "Delete",
    removeConfirm: "Delete this design?",
    removeDescription: "This design will be removed from your profile page.",
    removeCancel: "Cancel",
    removeConfirmAction: "Delete",
    liveOn: "Live",
    liveOff: "Draft",
    image: "Design image",
    noImage: "No image yet",
    uploadImage: "Upload image",
    replaceImage: "Change image",
    removeImage: "Remove",
    detailsTitle: "Core design details",
    detailsDescription: "",
    titleLabel: "Design name",
    titlePlaceholder: "e.g. Fine line rose",
    sizeLabel: "Enter a sample size and a sample price for this design.",
    sizeHelp: "",
    sizePlaceholder: "10",
    priceLabel: "",
    priceHelp: "",
    priceMin: "Lower price",
    priceMax: "Upper price",
    detailLevelLabel: "Reference detail level",
    detailLevelHelp: "The price range above is entered for this detail level.",
    colorModeLabel: "Reference color mode",
    colorModeHelp: "The price range above is entered for this color setup.",
    chooseOption: "Select",
    optionalTitle: "Category",
    optionalDescription: "Categories help keep designs organized in the showcase.",
    category: "Category",
    customCategory: "Custom category",
    customCategoryPlaceholder: "e.g. Floral",
    shortDescription: "Short note",
    shortDescriptionPlaceholder:
      "Discounted design / I want to work this on the upper arm, etc.",
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
    detailLevels: {
      simple: "Simple",
      standard: "Standard",
      detailed: "Detailed",
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
      "Çalışmak istediğin özel tasarımlarını buraya yükleyebilirsin.",
    introHint: "Görseli, tasarım adını ve fiyat aralığını hızlıca ekleyebilirsin.",
    introSteps: [],
    addDesign: "Yeni tasarım ekle",
    emptyTitle: "İlk tasarımını ekle",
    emptyDescription: "Görsel, ad ve yaklaşık fiyat girerek başlayabilirsin.",
    item: "Tasarım",
    newItem: "Yeni tasarım",
    edit: "Düzenle",
    duplicate: "Çoğalt",
    remove: "Sil",
    removeConfirm: "Tasarımı silmek istiyor musun?",
    removeDescription: "Bu tasarım profil sayfandan kaldırılır.",
    removeCancel: "İptal",
    removeConfirmAction: "Sil",
    liveOn: "Yayında",
    liveOff: "Taslak",
    image: "Tasarım görseli",
    noImage: "Henüz görsel yok",
    uploadImage: "Görsel yükle",
    replaceImage: "Görsel değiştir",
    removeImage: "Kaldır",
    detailsTitle: "Temel tasarım bilgileri",
    detailsDescription: "",
    titleLabel: "Tasarım adı",
    titlePlaceholder: "Örn: Minimal gül",
    sizeLabel: "Bu tasarım için örnek bir boyut ve bu boyut için örnek fiyat gir.",
    sizeHelp: "",
    sizePlaceholder: "10",
    priceLabel: "",
    priceHelp: "",
    priceMin: "Alt fiyat",
    priceMax: "Üst fiyat",
    detailLevelLabel: "Referans detay seviyesi",
    detailLevelHelp: "Yukarıdaki fiyat aralığı bu detay seviyesi için girilir.",
    colorModeLabel: "Referans renk yapısı",
    colorModeHelp: "Yukarıdaki fiyat aralığı bu renk yapısı için girilir.",
    chooseOption: "Seç",
    optionalTitle: "Kategori",
    optionalDescription: "Kategori, tasarımları vitrinde düzenli göstermene yardımcı olur.",
    category: "Kategori",
    customCategory: "Özel kategori",
    customCategoryPlaceholder: "Örn: Floral",
    shortDescription: "Kısa not",
    shortDescriptionPlaceholder:
      "İndirimli tasarım/Üst kolda çalışmak istiyorum vb.",
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
    detailLevels: {
      simple: "Sade",
      standard: "Standart",
      detailed: "Detaylı",
    },
  },
} as const;

function createEmptyDesign(sortOrder: number): DesignDraft {
  return {
    id: crypto.randomUUID(),
    category: "flash-designs",
    title: "",
    shortDescription: "",
    imageUrl: "",
    imagePath: "",
    priceNote: "",
    referenceDetailLevel: "standard",
    referencePriceMin: null,
    referencePriceMax: null,
    referenceSizeCm: null,
    referenceColorMode: "black-grey",
    pricingMode: "size_adjusted",
    colorImpactPreference: "low",
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
    referenceDetailLevel: design.referenceDetailLevel ?? "standard",
    referencePriceMin: design.referencePriceMin ?? null,
    referencePriceMax: design.referencePriceMax ?? null,
    referenceSizeCm: design.referenceSizeCm ?? null,
    referenceColorMode: design.referenceColorMode ?? "black-grey",
    pricingMode: "size_adjusted",
    colorImpactPreference: "low",
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

function getNormalizedDesignForSave(design: DesignDraft, sortOrder: number): DesignDraft {
  return {
    ...design,
    sortOrder,
    referenceDetailLevel: design.referenceDetailLevel ?? "standard",
    referenceColorMode: design.referenceColorMode ?? "black-grey",
    pricingMode: "size_adjusted",
    colorImpactPreference: "low",
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
  const router = useRouter();
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
        referenceColorMode: design.referenceColorMode ?? null,
        pricingMode: design.pricingMode ?? null,
        colorImpactPreference: design.colorImpactPreference ?? null,
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

  const [editingDesignId, setEditingDesignId] = useState<string | null>(null);
  const [pendingOpen, setPendingOpen] = useState<PendingOpenState>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval>(null);
  const [focusTitleOnOpen, setFocusTitleOnOpen] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [quickAddPriceMin, setQuickAddPriceMin] = useState("");
  const [quickAddPriceMax, setQuickAddPriceMax] = useState("");
  const [quickAddImageFile, setQuickAddImageFile] = useState<File | null>(null);
  const [quickAddImageName, setQuickAddImageName] = useState<string | null>(null);
  const editingSnapshotRef = useRef<EditingSnapshot | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  const currentDesigns = watchedDesigns ?? [];
  const editingIndex = editingDesignId
    ? currentDesigns.findIndex((design) => design?.id === editingDesignId)
    : -1;
  const editingDesign = editingIndex >= 0 ? currentDesigns[editingIndex] : null;
  const orderedDesignEntries = designsFieldArray.fields
    .map((field, index) => ({
      field,
      index,
      design: currentDesigns[index],
    }))
    .sort((left, right) => {
      if ((left.design?.id || left.field.id) === editingDesignId) {
        return -1;
      }
      if ((right.design?.id || right.field.id) === editingDesignId) {
        return 1;
      }
      return left.index - right.index;
    });

  function resetQuickAdd() {
    setQuickAddTitle("");
    setQuickAddPriceMin("");
    setQuickAddPriceMax("");
    setQuickAddImageFile(null);
    setQuickAddImageName(null);
  }

  function getCurrentDesigns() {
    return (form.getValues("designs") ?? []).map((design, index) =>
      normalizeDesign(design as PartialDesignDraft, index),
    );
  }

  function resetEditorState() {
    editingSnapshotRef.current = null;
    setEditingDesignId(null);
    setFocusTitleOnOpen(false);
  }

  function beginEditing(designId: string, options?: { isNew?: boolean; focusTitle?: boolean }) {
    const design = getCurrentDesigns().find((item) => item.id === designId);

    if (!design) {
      return;
    }

    editingSnapshotRef.current = {
      designId,
      values: structuredClone(design),
      isNew: options?.isNew ?? false,
    };
    setEditingDesignId(designId);
    setFocusTitleOnOpen(Boolean(options?.focusTitle));
  }

  function cancelEditing() {
    const snapshot = editingSnapshotRef.current;

    if (!snapshot) {
      resetEditorState();
      return;
    }

    const current = getCurrentDesigns();
    const nextDesigns = snapshot.isNew
      ? current.filter((design) => design.id !== snapshot.designId)
      : current.map((design) => (design.id === snapshot.designId ? snapshot.values : design));

    form.reset({
      designs: nextDesigns.map((design, index) => ({
        ...design,
        sortOrder: index,
      })),
    });
    form.clearErrors("root");
    resetEditorState();
  }

  function openDesign(designId: string, options?: { isNew?: boolean; focusTitle?: boolean }) {
    if (editingSnapshotRef.current?.designId && editingSnapshotRef.current.designId !== designId) {
      cancelEditing();
    }

    beginEditing(designId, options);
  }

  function addDesign(source?: PartialDesignDraft, seed?: Partial<DesignDraft>, imageFile?: File | null) {
    if (editingSnapshotRef.current) {
      cancelEditing();
    }

    const nextDesign = source
      ? cloneDesign(source, designsFieldArray.fields.length)
      : createEmptyDesign(designsFieldArray.fields.length);
    if (seed) {
      Object.assign(nextDesign, seed);
    }
    const designId = nextDesign.id ?? crypto.randomUUID();
    nextDesign.id = designId;

    designsFieldArray.prepend(nextDesign);
    setPendingOpen({
      designId,
      isNew: true,
      focusTitle: true,
      imageFile,
    });
  }

  useEffect(() => {
    if (!pendingOpen) {
      return;
    }

    const designExists = (form.getValues("designs") ?? []).some(
      (design) => design.id === pendingOpen.designId,
    );

    if (!designExists) {
      return;
    }

    beginEditing(pendingOpen.designId, {
      isNew: pendingOpen.isNew,
      focusTitle: pendingOpen.focusTitle,
    });
    if (pendingOpen.imageFile) {
      const nextIndex = (form.getValues("designs") ?? []).findIndex(
        (design) => design.id === pendingOpen.designId,
      );
      if (nextIndex !== -1) {
        void handleImageUpload(nextIndex, pendingOpen.imageFile);
      }
    }
    setPendingOpen(null);
  }, [form, pendingOpen, watchedDesigns]);

  useEffect(() => {
    if (!flashMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setFlashMessage(null), 2200);
    return () => window.clearTimeout(timeout);
  }, [flashMessage]);

  useEffect(() => {
    if (!focusTitleOnOpen || !editingDesignId) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
      setFocusTitleOnOpen(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [editingDesignId, focusTitleOnOpen]);

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

  function handleRemove(designId: string) {
    const design = getCurrentDesigns().find((item) => item.id === designId);

    if (!design) {
      return;
    }

    setPendingRemoval({
      designId,
      title: design.title?.trim() || labels.newItem,
    });
  }

  function confirmRemoval() {
    void persistRemoval();
  }

  async function persistDesignsSnapshot(nextDesigns: DesignDraft[]) {
    const normalizedValues: FeaturedDesignValues = {
      designs: nextDesigns.map((design, index) => getNormalizedDesignForSave(design, index)),
    };

    const response = await fetch("/api/dashboard/designs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedValues),
    });
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;

    if (!response.ok) {
      form.setError("root", { message: payload?.message ?? labels.saveFailed });
      return null;
    }

    form.reset(normalizedValues);
    form.clearErrors("root");
    setFlashMessage(labels.saved);
    router.refresh();
    return normalizedValues;
  }

  async function persistRemoval() {
    if (!pendingRemoval) {
      return;
    }

    const nextDesigns = getCurrentDesigns().filter((design) => design.id !== pendingRemoval.designId);
    const saved = await persistDesignsSnapshot(nextDesigns);

    if (!saved) {
      return;
    }

    if (editingSnapshotRef.current?.designId === pendingRemoval.designId) {
      resetEditorState();
    }

    setPendingRemoval(null);
    form.clearErrors("root");
  }

  async function onSubmit(_values: FeaturedDesignValues) {
    const normalizedValues = await persistDesignsSnapshot(getCurrentDesigns());

    if (!normalizedValues) {
      return;
    }

    if (editingDesignId) {
      const savedDesign = normalizedValues.designs.find((design) => design.id === editingDesignId);

      if (savedDesign) {
        const savedDesignId = savedDesign.id ?? editingDesignId;
        editingSnapshotRef.current = {
          designId: savedDesignId,
          values: structuredClone({ ...savedDesign, id: savedDesignId }),
          isNew: false,
        };
      }
    }

  }

  const statusMessage = form.formState.errors.root?.message ?? null;
  const quickAddReady = Boolean(quickAddTitle.trim() || quickAddPriceMin.trim() || quickAddPriceMax.trim() || quickAddImageFile);

  return (
    <form
      className="space-y-3"
      onSubmit={form.handleSubmit(onSubmit)}
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        const tagName = target.tagName;
        const isTextarea = tagName === "TEXTAREA";
        const isButton = tagName === "BUTTON";

        if (event.key === "Escape" && editingDesignId) {
          event.preventDefault();
          cancelEditing();
          return;
        }

        if (event.key === "Enter" && !event.shiftKey && !isTextarea && !isButton) {
          event.preventDefault();
        }
      }}
    >
      {flashMessage ? (
        <div className="fixed right-5 top-5 z-[70] rounded-full border border-[var(--accent)]/20 bg-[color:color-mix(in_srgb,var(--background)_82%,black_18%)] px-4 py-2 text-sm text-[var(--accent-soft)] shadow-[0_18px_36px_rgba(0,0,0,0.28)]">
          {flashMessage}
        </div>
      ) : null}
      <Card className="surface-border overflow-hidden border-[var(--border-soft)] bg-[linear-gradient(180deg,var(--surface-1)_0%,color-mix(in_srgb,var(--bg-section)_94%,black_6%)_100%)] shadow-[0_18px_46px_rgba(0,0,0,0.16)]">
        <CardContent className="relative overflow-hidden px-3.5 pb-3.5 pt-5 sm:px-4 sm:pb-4 sm:pt-5.5">
          <BrandMonogram className="left-auto right-[-4%] top-[-16%] h-[180px] w-[180px]" opacity={0.06} />
          <div className="relative space-y-2.5">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-[34rem] space-y-1.5 pt-1.5">
                <p className="text-[11.5px] leading-[1.45] text-[var(--text-secondary)]">{labels.introHint}</p>
                {labels.introSteps.length > 0 ? (
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-dim)]">
                    {labels.introSteps.join(" • ")}
                  </p>
                ) : null}
                {statusMessage && !editingDesign ? <p className="text-sm text-red-300">{statusMessage}</p> : null}
              </div>
              {quickAddImageName ? (
                <div className="rounded-full border border-[var(--border-soft)] bg-white/[0.03] px-2.5 py-1 text-[11px] text-[var(--text-secondary)]">
                  {quickAddImageName}
                </div>
              ) : null}
            </div>

            <div className="grid gap-2 xl:grid-cols-[minmax(152px,0.78fr)_minmax(0,1.18fr)_minmax(0,0.98fr)_auto] xl:items-end">
            <Field label={labels.image} className="min-w-0 justify-end">
              <label className="flex h-8 cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-3 text-[11.5px] text-[var(--text-primary)] transition hover:bg-[rgba(255,255,255,0.05)]">
                <Upload className="size-4" />
                {quickAddImageName ? labels.replaceImage : labels.uploadImage}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      setQuickAddImageFile(file);
                      setQuickAddImageName(file.name);
                    }
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </Field>

            <Field label={labels.titleLabel} className="min-w-0">
              <Input
                value={quickAddTitle}
                onChange={(event) => setQuickAddTitle(event.target.value)}
                className="h-8 rounded-[12px] bg-white/[0.03] text-[12.5px]"
                placeholder={labels.titlePlaceholder}
              />
            </Field>

            <Field label={labels.priceLabel} description={labels.priceHelp} className="min-w-0 justify-end">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  type="number"
                  className="h-8 rounded-[12px] bg-white/[0.03] text-[12.5px]"
                  placeholder="6000"
                  value={quickAddPriceMin}
                  onChange={(event) => setQuickAddPriceMin(event.target.value)}
                />
                <Input
                  type="number"
                  className="h-8 rounded-[12px] bg-white/[0.03] text-[12.5px]"
                  placeholder="8500"
                  value={quickAddPriceMax}
                  onChange={(event) => setQuickAddPriceMax(event.target.value)}
                />
              </div>
            </Field>

            <div className="flex items-center gap-1.5 xl:pb-[1px]">
              {quickAddImageName ? (
                <Button type="button" variant="ghost" size="sm" onClick={resetQuickAdd}>
                  <X className="size-4" />
                </Button>
              ) : null}
              <Button
                type="button"
                className="h-8 px-3 text-[12px]"
                onClick={() => {
                  addDesign(
                    undefined,
                    {
                      title: quickAddTitle,
                      referencePriceMin: quickAddPriceMin ? Number(quickAddPriceMin) : null,
                      referencePriceMax: quickAddPriceMax ? Number(quickAddPriceMax) : null,
                    },
                    quickAddImageFile,
                  );
                  resetQuickAdd();
                }}
                disabled={!quickAddReady}
              >
                <Plus className="size-4" />
                {labels.addDesign}
              </Button>
            </div>
          </div>
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
              <h3 className="text-lg font-semibold tracking-[-0.02em] text-white">{labels.emptyTitle}</h3>
              <p className="max-w-[34ch] text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground-muted)_82%,white_8%)]">
                {labels.emptyDescription}
              </p>
            </div>
            <Button
              type="button"
              onClick={() => addDesign()}
            >
              <Plus className="size-4" />
              {labels.addDesign}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {orderedDesignEntries.map(({ field, index, design }) => {
            const title = design?.title?.trim() || `${labels.newItem} ${index + 1}`;
            const category = getCategoryLabel(design?.category || "flash-designs");
            const sizeValue = toNullableNumber(design?.referenceSizeCm);
            const size = sizeValue ? `${sizeValue} cm` : null;
            const min = formatCurrency(locale, toNullableNumber(design?.referencePriceMin));
            const max = formatCurrency(locale, toNullableNumber(design?.referencePriceMax));
            const priceText = min && max ? `${min} – ${max}` : min ?? max ?? "—";
            const metaText = [category, size].filter(Boolean).join(" • ");
            const designId = design?.id || field.id;
            const isEditing = editingDesignId === designId;
            return (
              <Card
                key={field.id}
                className={cn(
                  "surface-border overflow-hidden border-white/8 shadow-[0_14px_32px_rgba(0,0,0,0.1)] transition",
                  isEditing
                    ? "border-[var(--accent)]/28 bg-[color:color-mix(in_srgb,var(--background)_88%,white_5%)] shadow-[0_20px_42px_rgba(0,0,0,0.2)]"
                    : "bg-[color:color-mix(in_srgb,var(--background)_93%,white_3%)]",
                )}
              >
                <CardContent className={cn("p-2.5 xl:p-2", isEditing ? "space-y-2.5" : "")}>
                  <div
                    role={isEditing ? undefined : "button"}
                    tabIndex={isEditing ? -1 : 0}
                    onClick={() => {
                      if (!isEditing) {
                        openDesign(designId);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (isEditing) {
                        return;
                      }

                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDesign(designId);
                      }
                    }}
                    className={cn(
                      "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-2.5",
                      isEditing ? "rounded-[16px] border border-white/8 bg-white/[0.02] px-2.5 py-2.5" : "",
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-[12px] border border-white/8 bg-white/[0.03]">
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

                      <div className="min-w-0 space-y-1.5">
                        <div className="space-y-1">
                          {isEditing ? (
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase tracking-[0.16em] text-[color:color-mix(in_srgb,var(--foreground-muted)_72%,white_10%)]">
                                {labels.drawerTitle}
                              </p>
                              <p className="truncate text-[0.98rem] font-semibold tracking-[-0.02em] text-white">
                                {title}
                              </p>
                            </div>
                          ) : (
                            <>
                              <p className="truncate text-[0.98rem] font-semibold tracking-[-0.02em] text-white">
                                {title}
                              </p>
                              <p className="text-[12px] leading-[1.35] text-[color:color-mix(in_srgb,var(--foreground-muted)_82%,white_10%)]">
                                {metaText || "—"}
                              </p>
                            </>
                          )}
                        </div>

                        {!isEditing ? (
                          <div className="flex flex-wrap gap-1.5">
                            <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/88">
                              {priceText}
                            </span>
                            <span
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-[10px] font-medium",
                                design?.active
                                  ? "border-[var(--accent)]/22 bg-[var(--accent)]/10 text-[var(--accent-soft)]"
                                  : "border-white/8 bg-white/[0.03] text-[color:color-mix(in_srgb,var(--foreground-muted)_80%,white_10%)]",
                              )}
                            >
                              {design?.active ? labels.liveOn : labels.liveOff}
                            </span>
                          </div>
                        ) : (
                          <p className="text-[12px] leading-[1.35] text-[color:color-mix(in_srgb,var(--foreground-muted)_82%,white_10%)]">
                            {metaText || "—"}
                          </p>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="sticky top-2 z-10 flex flex-wrap items-center justify-end gap-1.5 self-start sm:ml-2.5 sm:min-w-[272px]">
                        <div className="flex items-center gap-2 rounded-[13px] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.03)] px-2.5 py-1.5">
                          <div className="space-y-0.5">
                            <p className="text-[11.5px] font-medium text-[var(--text-primary)]">{labels.statusLabel}</p>
                            <p className="text-[9.5px] leading-[1.3] text-[var(--text-muted)]">
                              {labels.statusHelp}
                            </p>
                          </div>
                          <label className="relative mt-0.5 inline-flex items-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              {...form.register(`designs.${editingIndex}.active`)}
                            />
                            <span className="h-5.5 w-10 rounded-full bg-white/10 transition peer-checked:bg-[var(--accent)]/35" />
                            <span className="pointer-events-none absolute left-1 size-4 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4.5 peer-checked:bg-[var(--accent)]" />
                          </label>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <Button type="button" variant="secondary" onClick={cancelEditing} className="h-8 px-3 text-[11.5px]">
                            {labels.cancel}
                          </Button>
                          <Button
                            type="submit"
                            disabled={form.formState.isSubmitting || !form.formState.isDirty}
                            className="h-8 px-3 text-[11.5px]"
                          >
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
                    ) : (
                      <div
                        className="flex flex-wrap items-center gap-2 sm:shrink-0"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <Button type="button" variant="secondary" onClick={() => openDesign(designId)}>
                          <PencilLine className="size-4" />
                          {labels.edit}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-white/82 hover:text-white"
                          onClick={() =>
                            addDesign(form.getValues(`designs.${index}`) as PartialDesignDraft)
                          }
                        >
                          <Copy className="size-4" />
                          {labels.duplicate}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-200 hover:text-red-100"
                          onClick={() => handleRemove(designId)}
                        >
                          <Trash2 className="size-4" />
                          {labels.remove}
                        </Button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <>
                      <input type="hidden" {...form.register(`designs.${editingIndex}.id`)} />
                      <input type="hidden" {...form.register(`designs.${editingIndex}.category`)} />
                      <input type="hidden" {...form.register(`designs.${editingIndex}.imagePath`)} />
                      <input type="hidden" {...form.register(`designs.${editingIndex}.imageUrl`)} />

                      {statusMessage ? <p className="text-sm text-red-300">{statusMessage}</p> : null}

                      <div className="grid gap-2.5 xl:grid-cols-[224px_minmax(0,1fr)] xl:items-start">
                        <EditorSection title={labels.image}>
                          <div className="space-y-2">
                            <div className="relative flex h-[170px] items-center justify-center overflow-hidden rounded-[16px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))]">
                              {editingDesign?.imageUrl ? (
                                <img
                                  src={editingDesign.imageUrl}
                                  alt={editingDesign.title || labels.newItem}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="space-y-1.5 text-center text-[var(--text-muted)]">
                                  <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white/[0.03]">
                                    <ImagePlus className="size-4" />
                                  </div>
                                  <p className="text-[10.5px] text-[var(--text-muted)]">{labels.noImage}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-[12px] border border-[var(--border-soft)] bg-white/[0.03] px-3 text-[11.5px] text-[var(--text-primary)] transition hover:bg-white/[0.06]">
                                <Upload className="size-4" />
                                {editingDesign?.imageUrl ? labels.replaceImage : labels.uploadImage}
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
                              {editingDesign?.imageUrl ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2.5 text-[11.5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                  onClick={() => void handleImageRemove(editingIndex)}
                                >
                                  <X className="size-4" />
                                  {labels.removeImage}
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </EditorSection>

                        <div className="space-y-2.5">
                          <EditorSection title={labels.detailsTitle} description={labels.detailsDescription}>
                            <div className="grid gap-2.5 xl:grid-cols-2">
                              <Field
                                label={labels.titleLabel}
                                error={form.formState.errors.designs?.[editingIndex]?.title?.message}
                                className="xl:col-span-2"
                              >
                                {(() => {
                                  const titleRegistration = form.register(`designs.${editingIndex}.title`);

                                  return (
                                    <Input
                                      ref={(node) => {
                                        titleRegistration.ref(node);
                                        titleInputRef.current = node;
                                      }}
                                      className="h-8 rounded-[13px] bg-white/[0.03] text-[12.5px]"
                                      placeholder={labels.titlePlaceholder}
                                      name={titleRegistration.name}
                                      onBlur={titleRegistration.onBlur}
                                      onChange={titleRegistration.onChange}
                                    />
                                  );
                                })()}
                              </Field>

                              <Field
                                label={labels.sizeLabel}
                                description={labels.sizeHelp}
                                className="xl:col-span-2"
                              >
                                <div className="grid gap-2.5 xl:grid-cols-[minmax(0,180px)_minmax(0,1fr)] xl:items-start">
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      className="h-8 rounded-[13px] bg-white/[0.03] pr-10 text-[12.5px]"
                                      placeholder={labels.sizePlaceholder}
                                      {...form.register(`designs.${editingIndex}.referenceSizeCm`)}
                                    />
                                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-[var(--text-muted)]">
                                      cm
                                    </span>
                                  </div>

                                  <div className="grid gap-2.5 sm:grid-cols-2">
                                  <Field
                                    label={labels.priceMin}
                                    className="gap-1.5"
                                    error={form.formState.errors.designs?.[editingIndex]?.referencePriceMin?.message}
                                  >
                                    <Input
                                      type="number"
                                      className="h-8 rounded-[13px] bg-white/[0.03] text-[12.5px]"
                                      placeholder="6000"
                                      {...form.register(`designs.${editingIndex}.referencePriceMin`)}
                                    />
                                  </Field>
                                  <Field
                                    label={labels.priceMax}
                                    className="gap-1.5"
                                    error={form.formState.errors.designs?.[editingIndex]?.referencePriceMax?.message}
                                  >
                                    <Input
                                      type="number"
                                      className="h-8 rounded-[13px] bg-white/[0.03] text-[12.5px]"
                                      placeholder="8500"
                                      {...form.register(`designs.${editingIndex}.referencePriceMax`)}
                                    />
                                  </Field>
                                  </div>
                                </div>
                              </Field>
                            </div>
                          </EditorSection>

                          <EditorSection title={labels.optionalTitle} description={labels.optionalDescription}>
                            <div className="grid gap-2.5 xl:grid-cols-2">
                              <Field label={labels.category}>
                                <NativeSelect
                                  className="h-8 rounded-[13px] bg-white/[0.03] text-[12.5px]"
                                  value={getCategorySelectValue(editingDesign?.category || "")}
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

                              {getCategorySelectValue(editingDesign?.category || "") === "__custom__" ? (
                                <Field label={labels.customCategory}>
                                  <Input
                                    className="h-8 rounded-[13px] bg-white/[0.03] text-[12.5px]"
                                    placeholder={labels.customCategoryPlaceholder}
                                    value={editingDesign?.category || ""}
                                    onChange={(event) =>
                                      form.setValue(`designs.${editingIndex}.category`, event.target.value, {
                                        shouldDirty: true,
                                        shouldValidate: true,
                                      })
                                    }
                                  />
                                </Field>
                              ) : null}

                              <Field
                                label={labels.shortDescription}
                                className="xl:col-span-2"
                              >
                                <Textarea
                                  className="min-h-[72px] rounded-[14px] bg-white/[0.03] text-[12.5px]"
                                  placeholder={labels.shortDescriptionPlaceholder}
                                  {...form.register(`designs.${editingIndex}.shortDescription`)}
                                />
                              </Field>
                            </div>
                          </EditorSection>
                        </div>
                      </div>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {pendingRemoval ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <Card className="surface-border w-full max-w-md border-white/10 bg-[color:color-mix(in_srgb,var(--background)_94%,black_6%)] shadow-[0_24px_64px_rgba(0,0,0,0.32)]">
            <CardContent className="space-y-5 p-5">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-white">{labels.removeConfirm}</h3>
                <p className="text-sm leading-6 text-[color:color-mix(in_srgb,var(--foreground-muted)_82%,white_10%)]">
                  {labels.removeDescription}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setPendingRemoval(null)}>
                  {labels.removeCancel}
                </Button>
                <Button type="button" variant="ghost" className="text-red-200 hover:text-red-100" onClick={confirmRemoval}>
                  <Trash2 className="size-4" />
                  {labels.removeConfirmAction}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </form>
  );
}
