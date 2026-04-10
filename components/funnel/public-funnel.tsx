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
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { turkeyCities } from "@/lib/constants/cities";
import { deriveSizeCategoryFromCm, getPlacementSizeConstraint } from "@/lib/constants/size-estimation";
import {
  getPublicCopy,
  getStyleDescription,
  getStyleLabel,
  type PublicLocale,
} from "@/lib/i18n/public";
import type { ArtistFeaturedDesign, ArtistPageData } from "@/lib/types";
import { buildThemeStyles } from "@/lib/theme";
import { useFunnelStore } from "@/store/funnel-store";
import { formatCompactCurrencyRange } from "@/lib/utils";

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
  const selectedDesign = useMemo(
    () => findSelectedDesign(activeDesigns, draft.selectedDesignId),
    [activeDesigns, draft.selectedDesignId],
  );
  const copy = getPublicCopy(locale);
  const activeStyleInfoDescription = styleInfoKey
    ? getStyleDescription(styleInfoKey, locale) ??
      (locale === "tr"
        ? "Bu stilin son yorumu sanatçıyla görüşme sırasında netleştirilebilir."
        : "The artist can refine the final interpretation of this style during consultation.")
    : null;
  const stepMeta = copy.stepTitles.map((title, index) => ({
    step: index + 1,
    title,
    description: copy.stepDescriptions[index],
  }));
  const progress = (Math.min(step, stepMeta.length) / stepMeta.length) * 100;
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
      ? "Yerleşim, boyut ve tarzı seç. Mesaja geçmeden önce yaklaşık fiyat aralığını görebilirsin."
      : "Choose the placement, size, and style to see an approximate price range before messaging the artist.");
  const primaryActionLabel = artist.pageTheme.customCtaLabel || copy.defaultPrimaryCta;
  const { tokens } = buildThemeStyles(artist.pageTheme);
  const primaryButtonClass = "border-0 shadow-none hover:opacity-95";
  const secondaryButtonClass = "border-0 shadow-none hover:opacity-95";
  const styleStepActive = requiresStyleSelection(draft.intent);
  const compactArtistHeader = step > 1 || Boolean(draft.intent);

  async function handleFinalSubmit() {
    setSubmitting(true);
    setResult(null);
    setStep(6);

    const requestPromise = fetch("/api/public/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        artistSlug: artist.profile.slug,
        locale,
        ...draft,
      }),
    });

    const [response] = await Promise.all([
      requestPromise,
      new Promise((resolve) => window.setTimeout(resolve, getDelayMs())),
    ]);

    const payload = (await response.json()) as SubmissionResponse;
    setSubmitting(false);

    if (!response.ok || !payload) {
      setStep(5);
      return;
    }

    setResult({
      estimatedMin: payload.estimatedMin,
      estimatedMax: payload.estimatedMax,
      summary: payload.summary,
      disclaimer: payload.disclaimer,
      whatsappLink: payload.whatsappLink,
      message: payload.message,
    });
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
    setField("style", isReadyMadeIntent(intent) ? "custom" : "");
    setField("notes", "");

    if (intent === "custom-tattoo" || intent === "not-sure") {
      window.setTimeout(() => setStep(2), 180);
    }
  }

  function handleNext() {
    if (step === 3 && !styleStepActive) {
      setStep(5);
      return;
    }

    if (step < 5) {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step === 5 && !styleStepActive) {
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
    (step === 4 && (!styleStepActive || Boolean(draft.style))) ||
    step === 5;

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-4 sm:space-y-6">
      <Card
        className={`${compactArtistHeader ? "sticky top-3 z-20 overflow-hidden" : "overflow-hidden"} w-full max-w-full min-w-0`}
        style={{
          borderColor: "var(--artist-border)",
          backgroundColor:
            "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
          borderRadius: "var(--artist-radius)",
        }}
      >
        {compactArtistHeader ? (
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <AvatarTile name={artist.profile.artistName} imageUrl={artist.profile.profileImageUrl} />
              </div>
              <div className="min-w-0">
                <p
                  className="truncate text-lg"
                  style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-foreground)" }}
                >
                  {artist.profile.artistName}
                </p>
                <p className="truncate text-sm" style={{ color: "var(--artist-muted)" }}>
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
            <CardContent className="-mt-12 min-w-0 space-y-4 p-4 sm:p-6">
              <AvatarTile name={artist.profile.artistName} imageUrl={artist.profile.profileImageUrl} />
              <div className="space-y-3">
                <Badge variant="accent">{artist.funnelSettings.introEyebrow}</Badge>
                <h1
                  className="text-[1.75rem] leading-tight sm:text-3xl"
                  style={{ fontFamily: "var(--artist-heading-font)", color: "var(--artist-foreground)" }}
                >
                  {introTitle}
                </h1>
                <p className="text-sm leading-7" style={{ color: "var(--artist-muted)" }}>
                  {introText}
                </p>
                <div className="flex flex-wrap gap-2 text-xs leading-5" style={{ color: "var(--artist-muted)" }}>
                  <span>{artist.profile.instagramHandle}</span>
                  <span>•</span>
                  <span>Mobile-first intake flow</span>
                  <span>•</span>
                  <span>WhatsApp handoff ready</span>
                </div>
              </div>
            </CardContent>
          </>
        )}
      </Card>

      <div ref={flowCardRef} className="w-full min-w-0 max-w-full">
        <Card
          className="w-full max-w-full min-w-0 overflow-hidden"
          style={{
            borderColor: "var(--artist-border)",
            backgroundColor:
              "color-mix(in srgb, var(--artist-card) calc(var(--artist-card-alpha) * 100%), transparent)",
            borderRadius: "var(--artist-radius)",
          }}
        >
        <CardHeader className="px-4 pb-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="break-words" style={{ color: "var(--artist-card-text)" }}>
                {result ? copy.stepTitles[5] : stepMeta[Math.min(step, 6) - 1]?.title}
              </CardTitle>
              <CardDescription className="break-words" style={{ color: "var(--artist-card-muted)" }}>
                {result ? copy.stepDescriptions[5] : stepMeta[Math.min(step, 6) - 1]?.description}
              </CardDescription>
            </div>
            <Badge variant="muted" className="w-fit self-start text-[10px] tracking-[0.14em] sm:text-[11px] sm:tracking-[0.2em]">
              {copy.stepLabel} {Math.min(step, 6)} / 6
            </Badge>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
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
              className="space-y-4"
            >
              {step === 1 ? (
                <IntentSelectionStep
                  locale={locale}
                  artistId={artist.profile.id}
                  currency={artist.profile.currency}
                  intent={draft.intent}
                  designs={activeDesigns}
                  selectedDesignId={draft.selectedDesignId}
                  referenceImage={draft.referenceImage}
                  referenceDescription={draft.referenceDescription}
                  onIntentChange={handleIntentChange}
                  onDesignSelect={(designId) => {
                    setField("selectedDesignId", designId);
                    setField("style", designId ? "custom" : draft.style);
                    if (designId) {
                      window.setTimeout(() => setStep(2), 180);
                    }
                  }}
                  onReferenceImageSelect={(imageUrl, imagePath) => {
                    setField("referenceImage", imageUrl);
                    setField("referenceImagePath", imagePath);
                  }}
                  onReferenceDescriptionChange={(value) => setField("referenceDescription", value)}
                />
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
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
                      window.setTimeout(() => setStep(3), 180);
                    }}
                  />
                </div>
              ) : null}

              {step === 3 ? (
                <SizeEstimationSelector
                  selectedPlacement={draft.bodyAreaDetail}
                  approximateSizeCm={draft.approximateSizeCm}
                  selectedStyle={styleStepActive ? draft.style : "custom"}
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

              {step === 4 && styleStepActive ? (
                <div className="grid gap-3">
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
                            window.setTimeout(() => setStep(5), 180);
                          }}
                          className="min-w-0 flex-1 rounded-[24px] border px-4 py-4 text-left transition"
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
                          className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border transition"
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
                        window.setTimeout(() => setStep(5), 180);
                      }}
                      className="min-w-0 flex-1 rounded-[24px] border px-4 py-4 text-left transition"
                      style={{
                        borderColor: draft.style === "not-sure-style" ? "var(--artist-primary)" : "var(--artist-border)",
                        backgroundColor: draft.style === "not-sure-style"
                          ? "color-mix(in srgb, var(--artist-primary) 16%, transparent)"
                          : "rgba(0,0,0,0.12)",
                        color: tokens.cardText,
                      }}
                    >
                      <p className="break-words font-medium">{locale === "tr" ? "Henüz emin değilim" : "I'm not sure"}</p>
                    </button>
                    <button
                      type="button"
                      aria-label={copy.styleInfoButton}
                      onClick={() => setStyleInfoKey("not-sure-style")}
                      className="inline-flex size-12 shrink-0 items-center justify-center rounded-full border transition"
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
              ) : null}

              {step === 5 ? (
                <div className="space-y-4">
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
                        onChange={(event) => setField("city", event.target.value)}
                        style={{
                          borderColor: "var(--artist-border)",
                          color: "var(--artist-card-text)",
                        }}
                      >
                        <option value="">{copy.cityPlaceholder}</option>
                        {turkeyCities.map((city) => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </NativeSelect>
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
                      {copy.preferredTimingLabel}
                    </p>
                    <p className="mt-2 text-sm" style={{ color: "var(--artist-card-muted)" }}>
                      {copy.preferredTimingHelp}
                    </p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
                          {copy.preferredStartDate}
                        </span>
                        <input
                          type="date"
                          value={draft.preferredStartDate}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setField("preferredStartDate", nextValue);
                            if (draft.preferredEndDate && nextValue && draft.preferredEndDate < nextValue) {
                              setField("preferredEndDate", "");
                            }
                          }}
                          className="h-11 w-full rounded-[18px] border bg-transparent px-4 text-sm"
                          style={{
                            borderColor: "var(--artist-border)",
                            color: "var(--artist-card-text)",
                          }}
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium" style={{ color: "var(--artist-card-text)" }}>
                          {copy.preferredEndDate}
                        </span>
                        <input
                          type="date"
                          min={draft.preferredStartDate || undefined}
                          value={draft.preferredEndDate}
                          onChange={(event) => setField("preferredEndDate", event.target.value)}
                          className="h-11 w-full rounded-[18px] border bg-transparent px-4 text-sm"
                          style={{
                            borderColor: "var(--artist-border)",
                            color: "var(--artist-card-text)",
                          }}
                        />
                      </label>
                    </div>
                  </div>
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
                </div>
              ) : null}

              {step === 6 && !result ? (
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

              {step === 6 && result ? (
                <div className="space-y-5">
                  <div
                    className="rounded-[28px] border p-5"
                    style={{
                      borderColor: "color-mix(in srgb, var(--artist-primary) 28%, transparent)",
                      backgroundColor:
                        "color-mix(in srgb, var(--artist-primary) 12%, transparent)",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-1 size-5" style={{ color: "var(--artist-primary)" }} />
                      <div className="min-w-0">
                        <p className="text-sm uppercase tracking-[0.2em]" style={{ color: "var(--artist-primary)" }}>
                          {copy.estimatedRange}
                        </p>
                        <p
                          className="mt-2 break-words text-3xl sm:text-4xl"
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
                    <p className="text-sm" style={{ color: "var(--artist-card-text)" }}>{result.summary}</p>
                    <p className="mt-3 text-sm leading-6" style={{ color: "var(--artist-card-muted)" }}>
                      {result.disclaimer}
                    </p>
                  </div>
                  <div className="grid gap-3">
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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            {step > 1 && step < 6 ? (
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
                className={`w-full sm:ml-auto sm:w-auto ${primaryButtonClass}`}
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
                className={`w-full sm:ml-auto sm:w-auto ${primaryButtonClass}`}
                onClick={handleFinalSubmit}
                disabled={submitting}
                style={{
                  backgroundColor: "var(--artist-primary)",
                  color: "var(--artist-primary-foreground)",
                }}
              >
                {submitting ? copy.calculating : primaryActionLabel}
              </Button>
            ) : null}

            {step === 6 && result ? (
              <Button
                className={`w-full sm:ml-auto sm:w-auto ${secondaryButtonClass}`}
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
        </CardContent>
        </Card>
      </div>

      {styleInfoKey ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-x-hidden bg-black/70 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-full rounded-t-[28px] border border-white/10 bg-[#0f0f11] p-4 shadow-2xl sm:max-w-md sm:rounded-[28px]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-soft)]">
                  {copy.styleInfoTitle}
                </p>
                <h3 className="mt-2 break-words text-lg font-semibold text-white">
                  {getStyleLabel(styleInfoKey, locale)}
                </h3>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setStyleInfoKey(null)}>
                <X className="size-4" />
              </Button>
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--foreground-muted)]">
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
