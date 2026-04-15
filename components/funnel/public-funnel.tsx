"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Copy, Info, LoaderCircle, MessageCircle, Sparkles, X } from "lucide-react";

import { IntentSelectionStep } from "@/components/funnel/intent-selection-step";
import { BodyPlacementSelector } from "@/components/funnel/body-placement-selector";
import { SizeEstimationSelector } from "@/components/funnel/size-estimation-selector";
import { AvatarTile } from "@/components/shared/avatar-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateCalendarPopover } from "@/components/ui/date-calendar-popover";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { deriveSizeCategoryFromCm, getPlacementSizeConstraint } from "@/lib/constants/size-estimation";
import {
  getPublicCopy,
  getStyleDescription,
  getStyleLabel,
  type PublicLocale,
} from "@/lib/i18n/public";
import type {
  ArtistFeaturedDesign,
  ArtistPageData,
  ColorModeValue,
  DetailLevelValue,
} from "@/lib/types";
import { buildThemeStyles } from "@/lib/theme";
import { useFunnelStore } from "@/store/funnel-store";
import { formatCompactCurrencyRange } from "@/lib/utils";
import { hasProAccess } from "@/lib/access";
import type { IntentValue } from "@/lib/constants/options";

type SubmissionResponse = {
  estimatedMin: number;
  estimatedMax: number;
  summary: string;
  disclaimer: string;
  whatsappLink: string;
  message: string;
};

function isReadyMadeIntent(intent: string) {
  return intent === "flash-design" || intent === "discounted-design";
}

function requiresStyleSelection(intent: string) {
  return Boolean(intent) && !isReadyMadeIntent(intent);
}

function findSelectedDesign(designs: ArtistFeaturedDesign[], selectedDesignId: string) {
  return designs.find((design) => design.id === selectedDesignId) ?? null;
}

function getDelayMs() {
  return 2200 + Math.round(Math.random() * 1200);
}

const detailLevelOptions: DetailLevelValue[] = ["simple", "standard", "detailed"];
const colorModeOptions: ColorModeValue[] = ["black-only", "full-color"];

export function PublicFunnel({ artist, locale }: { artist: ArtistPageData; locale: PublicLocale }) {
  const {
    step,
    draft,
    result,
    submitting,
    setField,
    setStep,
    setSubmitting,
    setResult,
    reset,
  } = useFunnelStore();
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [styleInfoKey, setStyleInfoKey] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const flowCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    reset();
  }, [reset, artist.profile.slug]);

  useEffect(() => {
    if (!flowCardRef.current) {
      return;
    }

    window.setTimeout(() => {
      flowCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }, [step]);

  const enabledStyles = artist.styleOptions.filter((style) => style.enabled);
  const activeDesigns = artist.featuredDesigns.filter((design) => design.active);
  const hasFlashDesigns = activeDesigns.some((design) => design.category === "flash-designs");
  const hasDiscountedDesigns = activeDesigns.some(
    (design) => design.category === "discounted-designs",
  );
  const activeStyleOption = styleInfoKey
    ? artist.styleOptions.find((style) => style.styleKey === styleInfoKey)
    : null;
  const selectedDesign = useMemo(
    () => findSelectedDesign(activeDesigns, draft.selectedDesignId),
    [activeDesigns, draft.selectedDesignId],
  );
  const isProArtist = hasProAccess(artist.profile);
  const bookingCities = artist.funnelSettings.bookingCities;
  const selectedBookingCity = bookingCities.find((city) => city.cityName === draft.city) ?? null;
  const availableDatesForSelectedCity = selectedBookingCity?.availableDates ?? [];
  const requiresBookingSelection = bookingCities.length > 0;
  const availableIntents = useMemo<readonly IntentValue[]>(
    () => {
      const intents: IntentValue[] = ["custom-tattoo", "design-in-mind"];

      if (isProArtist && hasFlashDesigns) {
        intents.push("flash-design");
      }

      if (isProArtist && hasDiscountedDesigns) {
        intents.push("discounted-design");
      }

      intents.push("not-sure");

      return intents;
    },
    [hasDiscountedDesigns, hasFlashDesigns, isProArtist],
  );
  const copy = getPublicCopy(locale);
  const activeStyleInfoDescription = styleInfoKey
    ? activeStyleOption?.description ??
      getStyleDescription(styleInfoKey, locale) ??
      (locale === "tr"
        ? "Bu stilin son yorumu sanatçıyla görüşme sırasında netleştirilebilir."
        : "The artist can refine the final interpretation of this style during consultation.")
    : null;
  const stepMeta = copy.stepTitles.map((title, index) => ({
    step: index + 1,
    title,
    description: copy.stepDescriptions[index],
  }));
  const introTitle =
    artist.pageTheme.customWelcomeTitle ||
    artist.funnelSettings.introTitle ||
    artist.profile.welcomeHeadline ||
    (locale === "tr" ? "Dövme fikrini kısaca paylaş." : "Share your tattoo idea in a few quick steps.");
  const introText =
    artist.pageTheme.customIntroText ||
    artist.profile.shortBio ||
    artist.funnelSettings.introDescription ||
    (locale === "tr"
      ? "Yerleşim, boyut ve tarzı seç. Yaklaşık fiyatı hemen gör."
      : "Choose the placement, size, and style. See the approximate price right away.");
  const primaryActionLabel = artist.pageTheme.customCtaLabel || copy.defaultPrimaryCta;
  const { tokens } = buildThemeStyles(artist.pageTheme);
  const primaryButtonClass = "border-0 shadow-none hover:opacity-95";
  const secondaryButtonClass = "border-0 shadow-none hover:opacity-95";
  const styleStepActive = requiresStyleSelection(draft.intent);
  const isSelectedDesignFlow = Boolean(draft.selectedDesignId);
  const compactArtistHeader = step > 1 || Boolean(draft.intent);
  const resultStep = 6;
  const visibleStepMeta = isSelectedDesignFlow
    ? [stepMeta[0], stepMeta[1], stepMeta[2], stepMeta[4], stepMeta[5]]
    : stepMeta;
  const displayStep = isSelectedDesignFlow
    ? step <= 3
      ? step
      : step === 5
        ? 4
        : 5
    : Math.min(step, 6);
  const displayMeta =
    visibleStepMeta[Math.max(0, Math.min(displayStep, visibleStepMeta.length) - 1)];
  const displayProgress = (displayStep / visibleStepMeta.length) * 100;

  async function handleFinalSubmit() {
    if (requiresBookingSelection) {
      if (!draft.city || !selectedBookingCity) {
        setBookingError(copy.cityLabel);
        return;
      }

      if (!draft.preferredStartDate || !availableDatesForSelectedCity.includes(draft.preferredStartDate)) {
        setBookingError(copy.noAvailableDates);
        return;
      }
    }

    setBookingError(null);
    setSubmitting(true);
    setResult(null);
    setStep(resultStep);

    const payload = {
      artistSlug: artist.profile.slug,
      locale,
      ...draft,
      selectedDesignId: draft.selectedDesignId || null,
      referenceImage: draft.referenceImage || null,
      referenceImagePath: draft.referenceImagePath || null,
      referenceDescription: draft.referenceDescription || undefined,
      city: draft.city || undefined,
      preferredStartDate: draft.preferredStartDate || undefined,
      preferredEndDate: draft.preferredEndDate || undefined,
      detailLevel: draft.detailLevel || undefined,
      colorMode: draft.colorMode || undefined,
      coverUp: draft.coverUp === null ? undefined : draft.coverUp,
      notes: draft.notes || undefined,
      customDesign:
        !draft.selectedDesignId &&
        draft.intent !== "flash-design" &&
        draft.intent !== "discounted-design",
      designType: draft.intent || null,
    };

    try {
      const requestPromise = fetch("/api/public/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const [response] = await Promise.all([
        requestPromise,
        new Promise((resolve) => window.setTimeout(resolve, getDelayMs())),
      ]);

      const responsePayload = (await response.json()) as SubmissionResponse;
      setSubmitting(false);

      if (!response.ok || !responsePayload) {
        setBookingError(copy.calculatingBody);
        setStep(5);
        return;
      }

      setResult({
        estimatedMin: responsePayload.estimatedMin,
        estimatedMax: responsePayload.estimatedMax,
        summary: responsePayload.summary,
        disclaimer: responsePayload.disclaimer,
        whatsappLink: responsePayload.whatsappLink,
        message: responsePayload.message,
      });
    } catch {
      setSubmitting(false);
      setBookingError(copy.calculatingBody);
      setStep(5);
    }
  }

  async function copyMessage() {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result.message);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1800);
  }

  function handleIntentChange(intent: typeof draft.intent) {
    setField("intent", intent);
    setField("selectedDesignId", "");
    setField("referenceImage", "");
    setField("referenceImagePath", "");
    setField("referenceDescription", "");
    setField("city", "");
    setField("bodyAreaGroup", "");
    setField("bodyAreaDetail", "");
    setField("approximateSizeCm", null);
    setField("sizeCategory", "");
    setField("widthCm", null);
    setField("heightCm", null);
    setField("detailLevel", "");
    setField("colorMode", "");
    setField("coverUp", null);
    setField("style", isReadyMadeIntent(intent) ? "custom" : "not-sure-style");
    setField("notes", "");
  }

  function handleNext() {
    if (isSelectedDesignFlow && step === 3) {
      setStep(5);
      return;
    }

    if (step < 5) {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (isSelectedDesignFlow && step === 5) {
      setStep(3);
      return;
    }

    setStep(Math.max(step - 1, 1));
  }

  const canAdvance =
    (step === 1 &&
      Boolean(
        draft.intent &&
          (!isReadyMadeIntent(draft.intent) || draft.selectedDesignId),
      )) ||
    (step === 2 && Boolean(draft.bodyAreaGroup && draft.bodyAreaDetail)) ||
    (step === 3 && Boolean(draft.approximateSizeCm && draft.sizeCategory)) ||
    (step === 4 &&
      (isSelectedDesignFlow || (Boolean(draft.detailLevel) && Boolean(draft.colorMode)))) ||
    step === 5;

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-clip space-y-3 sm:space-y-6">
      <Card
        className={`${compactArtistHeader ? "sticky top-2 z-20 overflow-hidden" : "overflow-hidden"} w-full min-w-0 max-w-full overflow-x-clip`}
        style={{
          borderColor: "var(--artist-border)",
          backgroundColor:
            "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
          borderRadius: "var(--artist-radius)",
        }}
      >
        {compactArtistHeader ? (
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="shrink-0">
                <AvatarTile
                  name={artist.profile.artistName}
                  imageUrl={artist.profile.profileImageUrl}
                  planType={artist.profile.planType}
                />
              </div>
              <div className="min-w-0">
                <p
                  className="truncate text-base sm:text-lg"
                  style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-card-text)" }}
                >
                  {artist.profile.artistName}
                </p>
                <p className="truncate text-xs sm:text-sm" style={{ color: "var(--artist-card-muted)" }}>
                  {artist.profile.instagramHandle}
                </p>
              </div>
            </div>
          </CardContent>
        ) : (
          <>
            <div
              className="h-40 w-full border-b bg-grid"
              style={
                artist.profile.coverImageUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(9,9,11,0.15), rgba(9,9,11,0.88)), url(${artist.profile.coverImageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      borderColor: "var(--artist-border)",
                    }
                  : { borderColor: "var(--artist-border)" }
              }
            />
            <CardContent className="-mt-12 min-w-0 space-y-3 p-4 sm:space-y-4 sm:p-6">
              <AvatarTile
                name={artist.profile.artistName}
                imageUrl={artist.profile.profileImageUrl}
                planType={artist.profile.planType}
              />
              <div className="space-y-3">
                <Badge variant="accent">{artist.funnelSettings.introEyebrow}</Badge>
                <h1
                  className="text-[1.55rem] leading-tight sm:text-3xl"
                  style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-card-text)" }}
                >
                  {introTitle}
                </h1>
                <p className="text-sm leading-6 sm:leading-7" style={{ color: "var(--artist-card-muted)" }}>
                  {introText}
                </p>
                <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] leading-4 sm:text-xs sm:leading-5" style={{ color: "var(--artist-card-muted)" }}>
                  <span>{artist.profile.instagramHandle}</span>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      <div ref={flowCardRef} className="w-full min-w-0 max-w-full">
        <Card
          className="w-full min-w-0 max-w-full overflow-x-clip"
          style={{
            borderColor: "var(--artist-border)",
            backgroundColor:
              "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
            borderRadius: "var(--artist-radius)",
          }}
        >
        <CardHeader className="px-4 pb-3 sm:px-6 sm:pb-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="break-words text-base sm:text-lg" style={{ color: "var(--artist-card-text)" }}>
                {result ? visibleStepMeta[visibleStepMeta.length - 1]?.title : displayMeta?.title}
              </CardTitle>
              {(result ? visibleStepMeta[visibleStepMeta.length - 1]?.description : displayMeta?.description) ? (
                <CardDescription className="break-words text-[13px] leading-5 sm:text-sm sm:leading-6" style={{ color: "var(--artist-card-muted)" }}>
                  {result ? visibleStepMeta[visibleStepMeta.length - 1]?.description : displayMeta?.description}
                </CardDescription>
              ) : null}
            </div>
            <Badge
              variant="muted"
              className="w-fit self-start text-[10px] tracking-[0.14em] sm:text-[11px] sm:tracking-[0.2em]"
              style={{
                color: "var(--artist-card-text)",
                backgroundColor:
                  "color-mix(in srgb, var(--artist-card) 88%, white 12%)",
                borderColor: "var(--artist-border)",
              }}
              >
              {copy.stepLabel} {displayStep} / {visibleStepMeta.length}
            </Badge>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6 sm:mt-4 sm:h-2">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${displayProgress}%`,
                background: `linear-gradient(90deg, ${artist.pageTheme.primaryColor}, ${artist.pageTheme.secondaryColor})`,
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${step}-${result ? "ready" : "idle"}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-3 sm:space-y-4"
            >
              {step === 1 ? (
                <IntentSelectionStep
                  locale={locale}
                  artistId={artist.profile.id}
                  intent={draft.intent}
                  designs={activeDesigns}
                  selectedDesignId={draft.selectedDesignId}
                  referenceImage={draft.referenceImage}
                  referenceDescription={draft.referenceDescription}
                  availableIntents={availableIntents}
                  onIntentChange={handleIntentChange}
                  onDesignSelect={(designId) => {
                    setField("selectedDesignId", designId);
                    setField("style", designId ? "custom" : draft.style);
                  }}
                  onReferenceImageSelect={(imageUrl, imagePath) => {
                    setField("referenceImage", imageUrl);
                    setField("referenceImagePath", imagePath);
                  }}
                  onReferenceDescriptionChange={(value) => setField("referenceDescription", value)}
                />
              ) : null}

              {step === 2 ? (
                <div className="space-y-3">
                  <BodyPlacementSelector
                    selectedDetail={draft.bodyAreaDetail}
                    locale={locale}
                    onSelect={(group, detail) => {
                      setField("bodyAreaGroup", group);
                      setField("bodyAreaDetail", detail);

                      if (!detail) {
                        setField("approximateSizeCm", null);
                        setField("sizeCategory", "");
                        setField("widthCm", null);
                        setField("heightCm", null);
                        return;
                      }

                      const defaultSize = getPlacementSizeConstraint(detail).defaultCm;
                      setField("sizeMode", "quick");
                      setField("approximateSizeCm", defaultSize);
                      setField("sizeCategory", deriveSizeCategoryFromCm(defaultSize));
                      setField("widthCm", null);
                      setField("heightCm", null);
                    }}
                  />
                </div>
              ) : null}

              {step === 3 ? (
                <SizeEstimationSelector
                  selectedPlacement={draft.bodyAreaDetail}
                  approximateSizeCm={draft.approximateSizeCm}
                  sizeTimeRanges={artist.pricingRules.sizeTimeRanges}
                  locale={locale}
                  onApproximateSizeChange={(cm) => {
                    setField("sizeMode", "quick");
                    setField("approximateSizeCm", cm);
                    setField("sizeCategory", deriveSizeCategoryFromCm(cm));
                    setField("widthCm", null);
                    setField("heightCm", null);
                  }}
                />
              ) : null}

              {step === 4 && !isSelectedDesignFlow ? (
                <div className="space-y-3">
                      <div
                        className="rounded-[24px] border p-4"
                        style={{
                          borderColor: "var(--artist-border)",
                          backgroundColor: "rgba(0,0,0,0.12)",
                        }}
                      >
                        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                          {copy.detailLevelTitle}
                        </p>
                        {copy.detailLevelHelp ? (
                          <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                            {copy.detailLevelHelp}
                          </p>
                        ) : null}
                        <div className="mt-4 grid gap-2.5 sm:gap-3">
                          {detailLevelOptions.map((level) => {
                            const active = draft.detailLevel === level;
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={() => setField("detailLevel", level)}
                                className="rounded-[24px] border px-4 py-4 text-left transition"
                                style={{
                                  borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                                  backgroundColor: active
                                    ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                                    : "rgba(0,0,0,0.12)",
                                  color: tokens.cardText,
                                }}
                              >
                                <p className="break-words font-medium">{copy.detailLevels[level]}</p>
                                <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                                  {copy.detailLevelDescriptions[level]}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div
                        className="rounded-[24px] border p-4"
                        style={{
                          borderColor: "var(--artist-border)",
                          backgroundColor: "rgba(0,0,0,0.12)",
                        }}
                      >
                        <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                          {copy.colorModeTitle}
                        </p>
                        <div className="mt-4 grid gap-2.5 sm:gap-3">
                          {colorModeOptions.map((mode) => {
                            const active = draft.colorMode === mode;
                            return (
                              <button
                                key={mode}
                                type="button"
                                onClick={() => setField("colorMode", mode)}
                                className="rounded-[24px] border px-4 py-4 text-left transition"
                                style={{
                                  borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                                  backgroundColor: active
                                    ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                                    : "rgba(0,0,0,0.12)",
                                  color: tokens.cardText,
                                }}
                              >
                                <p className="break-words font-medium">{copy.colorModes[mode]}</p>
                                <p className="mt-1 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                                  {copy.colorModeDescriptions[mode]}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {styleStepActive ? (
                        <div
                          className="rounded-[24px] border p-4"
                          style={{
                            borderColor: "var(--artist-border)",
                            backgroundColor: "rgba(0,0,0,0.12)",
                          }}
                        >
                          <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                            {copy.optionalStyleTitle}
                          </p>
                          {copy.optionalStyleHelp ? (
                            <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                              {copy.optionalStyleHelp}
                            </p>
                          ) : null}
                          <div className="mt-4 grid gap-2.5 sm:gap-3">
                            {enabledStyles.map((style) => {
                              const active = draft.style === style.styleKey;
                              return (
                                <div
                                  key={style.id}
                                  className="flex w-full max-w-full items-stretch gap-2 rounded-[24px]"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setField("style", style.styleKey);
                                    }}
                                    className="min-w-0 flex-1 whitespace-normal rounded-[24px] border px-4 py-4 text-left transition"
                                    style={{
                                      borderColor: active ? "var(--artist-primary)" : "var(--artist-border)",
                                      backgroundColor: active
                                        ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                                        : "rgba(0,0,0,0.12)",
                                      color: tokens.cardText,
                                    }}
                                  >
                                    <p className="break-words font-medium">
                                      {style.isCustom ? style.label : getStyleLabel(style.styleKey, locale)}
                                    </p>
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={copy.styleInfoButton}
                                    onClick={() => setStyleInfoKey(style.styleKey)}
                                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition sm:size-12"
                                    style={{
                                      borderColor: "var(--artist-border)",
                                      backgroundColor: "rgba(0,0,0,0.12)",
                                      color: "var(--artist-card-text)",
                                    }}
                                  >
                                    <Info className="size-4" />
                                  </button>
                                </div>
                              );
                            })}
                            <div className="flex w-full max-w-full items-stretch gap-2 rounded-[24px]">
                              <button
                                type="button"
                                onClick={() => {
                                  setField("style", "not-sure-style");
                                }}
                                className="min-w-0 flex-1 whitespace-normal rounded-[24px] border px-4 py-4 text-left transition"
                                style={{
                                  borderColor: draft.style === "not-sure-style" ? "var(--artist-primary)" : "var(--artist-border)",
                                  backgroundColor: draft.style === "not-sure-style"
                                    ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                                    : "rgba(0,0,0,0.12)",
                                  color: tokens.cardText,
                                }}
                              >
                                <p className="break-words font-medium">{locale === "tr" ? "Emin değilim" : "I'm not sure"}</p>
                              </button>
                              <button
                                type="button"
                                aria-label={copy.styleInfoButton}
                                onClick={() => setStyleInfoKey("not-sure-style")}
                                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border transition sm:size-12"
                                style={{
                                  borderColor: "var(--artist-border)",
                                  backgroundColor: "rgba(0,0,0,0.12)",
                                  color: "var(--artist-card-text)",
                                }}
                              >
                                <Info className="size-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                </div>
              ) : null}

              {step === 5 ? (
                <div className="space-y-3">
                  {selectedDesign ? (
                    <div
                      className="rounded-[24px] border p-4"
                      style={{
                        borderColor: "var(--artist-border)",
                        backgroundColor: "rgba(0,0,0,0.12)",
                      }}
                    >
                      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                        {copy.readyMadeDesign}
                      </p>
                      <p className="mt-2 text-base font-medium" style={{ color: "var(--artist-card-text)" }}>
                        {selectedDesign.title}
                      </p>
                    </div>
                  ) : null}
                  <div
                    className="rounded-[24px] border p-4"
                    style={{
                      borderColor: "var(--artist-border)",
                      backgroundColor: "rgba(0,0,0,0.12)",
                    }}
                  >
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                      {copy.contextTitle}
                    </p>
                    <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                      {copy.contextHelp}
                    </p>
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setField("coverUp", false)}
                        className="rounded-[24px] border px-4 py-4 text-left transition"
                        style={{
                          borderColor: draft.coverUp === false ? "var(--artist-primary)" : "var(--artist-border)",
                          backgroundColor: draft.coverUp === false
                            ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                            : "rgba(0,0,0,0.12)",
                          color: tokens.cardText,
                        }}
                      >
                        <p className="break-words font-medium">{copy.coverUpNo}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setField("coverUp", true)}
                        className="rounded-[24px] border px-4 py-4 text-left transition"
                        style={{
                          borderColor: draft.coverUp === true ? "var(--artist-primary)" : "var(--artist-border)",
                          backgroundColor: draft.coverUp === true
                            ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                            : "rgba(0,0,0,0.12)",
                          color: tokens.cardText,
                        }}
                      >
                        <p className="break-words font-medium">{copy.coverUpYes}</p>
                      </button>
                    </div>
                  </div>
                  <Textarea
                    style={{
                      backgroundColor: "rgba(0,0,0,0.12)",
                      borderColor: "var(--artist-border)",
                      color: "var(--artist-card-text)",
                    }}
                    value={draft.notes}
                    onChange={(event) => setField("notes", event.target.value)}
                    placeholder={copy.notesPlaceholder}
                  />
                  {requiresBookingSelection ? (
                    <div
                      className="rounded-[24px] border p-4"
                      style={{
                        borderColor: "var(--artist-border)",
                        backgroundColor: "rgba(0,0,0,0.12)",
                      }}
                    >
                      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                        {copy.cityLabel}
                      </p>
                      <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                        {copy.cityHelp}
                      </p>
                      <div className="mt-4">
                        <NativeSelect
                          value={draft.city}
                          onChange={(event) => {
                            setField("city", event.target.value);
                            setField("preferredStartDate", "");
                            setField("preferredEndDate", "");
                            setBookingError(null);
                          }}
                          style={{
                            borderColor: "var(--artist-border)",
                            color: "var(--artist-card-text)",
                          }}
                        >
                          <option value="">{copy.cityPlaceholder}</option>
                          {bookingCities.map((city) => (
                            <option key={city.id} value={city.cityName}>
                              {city.cityName}
                            </option>
                          ))}
                        </NativeSelect>
                      </div>
                    </div>
                  ) : null}
                  {requiresBookingSelection ? (
                    <div
                      className="rounded-[24px] border p-4"
                      style={{
                        borderColor: "var(--artist-border)",
                        backgroundColor: "rgba(0,0,0,0.12)",
                      }}
                    >
                      <p className="text-xs uppercase tracking-[0.24em]" style={{ color: "var(--artist-primary)" }}>
                        {copy.preferredTimingLabel}
                      </p>
                      <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                        {copy.preferredTimingHelp}
                      </p>
                      <div className="mt-4">
                        <div className="space-y-2">
                          <span className="text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
                            {copy.preferredStartDate}
                          </span>
                          <DateCalendarPopover
                            locale={locale}
                            mode="single"
                            disabled={!draft.city || availableDatesForSelectedCity.length === 0}
                            triggerLabel={copy.preferredTimingLabel}
                            emptyLabel={copy.preferredStartDate}
                            selectedDate={draft.preferredStartDate}
                            availableDates={availableDatesForSelectedCity}
                            onSelectDate={(date) => {
                              setField("preferredStartDate", date);
                              setField("preferredEndDate", "");
                              setBookingError(null);
                            }}
                          />
                        </div>
                      </div>
                      {draft.city && availableDatesForSelectedCity.length === 0 ? (
                        <p className="mt-3 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                          {copy.noAvailableDates}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {copy.notesHelper ? (
                    <div
                      className="rounded-[24px] border p-4 text-sm"
                      style={{
                        borderColor: "var(--artist-border)",
                        backgroundColor: "rgba(0,0,0,0.12)",
                        color: "var(--artist-card-muted)",
                      }}
                    >
                      {copy.notesHelper}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === resultStep && !result ? (
                <div
                  className="rounded-[28px] border p-6"
                  style={{
                    borderColor: "var(--artist-border)",
                    backgroundColor:
                      "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex size-12 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--artist-primary) 14%, transparent)",
                        color: "var(--artist-primary)",
                      }}
                    >
                      <LoaderCircle className="size-5 animate-spin" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-medium" style={{ color: "var(--artist-card-text)" }}>
                        {copy.calculatingTitle}
                      </p>
                      <p className="text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                        {copy.calculatingBody}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === resultStep && result ? (
                <div className="space-y-4 sm:space-y-5">
                  <div
                    className="rounded-[24px] border p-4 sm:rounded-[28px] sm:p-5"
                    style={{
                      borderColor: "color-mix(in srgb, var(--artist-primary) 28%, transparent)",
                      backgroundColor:
                        "color-mix(in srgb, var(--artist-primary) 12%, transparent)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-1 size-5" style={{ color: "var(--artist-primary)" }} />
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.18em] sm:text-sm sm:tracking-[0.2em]" style={{ color: "var(--artist-primary)" }}>
                          {copy.estimatedRange}
                        </p>
                        <p
                          className="mt-2 break-words text-[1.75rem] leading-tight sm:text-4xl"
                          style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-card-text)" }}
                        >
                          {formatCompactCurrencyRange(
                            result.estimatedMin,
                            result.estimatedMax,
                            artist.profile.currency,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div
                    className="rounded-[24px] border p-4"
                    style={{
                      borderColor: "var(--artist-border)",
                      backgroundColor: "rgba(0,0,0,0.12)",
                    }}
                  >
                    <p className="text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                      {result.disclaimer}
                    </p>
                  </div>
                  <div className="grid gap-2.5 sm:gap-3">
                    <Button asChild className="w-full">
                      <a
                        href={result.whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: "var(--artist-primary)",
                          color: "var(--artist-primary-foreground)",
                        }}
                      >
                        <MessageCircle className="size-4" />
                        {copy.sendWhatsapp}
                      </a>
                    </Button>
                    <Button
                      className={`w-full ${secondaryButtonClass}`}
                      variant="secondary"
                      onClick={copyMessage}
                      style={{
                        backgroundColor: "var(--artist-secondary)",
                        color: "var(--artist-secondary-foreground)",
                      }}
                    >
                      {copyState === "copied" ? (
                        <>
                          <Check className="size-4" />
                          {copy.copiedForInstagram}
                        </>
                      ) : (
                        <>
                          <Copy className="size-4" />
                          {copy.copyMessage}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </AnimatePresence>

          <div className="mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:items-center sm:gap-3">
            {step > 1 && step < resultStep ? (
              <Button
                variant="outline"
                onClick={handleBack}
                className={`w-full sm:w-auto ${secondaryButtonClass}`}
                style={{
                  backgroundColor: "var(--artist-secondary)",
                  color: "var(--artist-secondary-foreground)",
                  borderColor: "transparent",
                }}
              >
                <ArrowLeft className="size-4" />
                {copy.back}
              </Button>
            ) : null}

            {step < 5 ? (
              <Button
                className={`w-full whitespace-normal sm:ml-auto sm:w-auto ${primaryButtonClass}`}
                onClick={handleNext}
                disabled={!canAdvance}
                style={{
                  backgroundColor: "var(--artist-primary)",
                  color: "var(--artist-primary-foreground)",
                }}
              >
                {copy.next}
                <ArrowRight className="size-4" />
              </Button>
            ) : null}

            {step === 5 ? (
              <Button
                className={`w-full whitespace-normal sm:ml-auto sm:w-auto ${primaryButtonClass}`}
                onClick={handleFinalSubmit}
                disabled={
                  submitting ||
                  (requiresBookingSelection &&
                    (!draft.city || !draft.preferredStartDate || !selectedBookingCity))
                }
                style={{
                  backgroundColor: "var(--artist-primary)",
                  color: "var(--artist-primary-foreground)",
                }}
              >
                {submitting ? copy.calculating : primaryActionLabel}
              </Button>
            ) : null}

            {step === resultStep && result ? (
              <Button
                className={`w-full whitespace-normal sm:ml-auto sm:w-auto ${secondaryButtonClass}`}
                variant="outline"
                onClick={() => {
                  reset();
                  setCopyState("idle");
                }}
                style={{
                  backgroundColor: "var(--artist-secondary)",
                  color: "var(--artist-secondary-foreground)",
                  borderColor: "transparent",
                }}
              >
                {copy.startOver}
              </Button>
            ) : null}
          </div>
          {bookingError ? (
            <p className="mt-3 text-sm text-[var(--accent-soft)]">{bookingError}</p>
          ) : null}
        </CardContent>
        </Card>
      </div>

      {styleInfoKey ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-clip bg-black/70 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92dvh] w-full max-w-[calc(100vw-0.75rem)] overflow-y-auto rounded-t-[28px] border border-white/10 bg-[#0f0f11] p-4 shadow-2xl sm:max-w-md sm:rounded-[28px]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-soft)]">
                  {copy.styleInfoTitle}
                </p>
                <h3 className="mt-2 break-words text-lg font-semibold text-white">
                  {activeStyleOption?.isCustom ? activeStyleOption.label : getStyleLabel(styleInfoKey, locale)}
                </h3>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setStyleInfoKey(null)}>
                <X className="size-4" />
              </Button>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--foreground-muted)]">
              {activeStyleInfoDescription}
            </p>
            <div className="mt-5">
              <Button type="button" className="w-full" onClick={() => setStyleInfoKey(null)}>
                {copy.close}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
