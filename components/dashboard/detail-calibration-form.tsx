"use client";

import Image, { type StaticImageData } from "next/image";
import { ArrowLeft, Check, LoaderCircle, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import floralHighImage from "@/sample-tattoos/detail-calibration-samples/high2.png";
import geometricHighImage from "@/sample-tattoos/detail-calibration-samples/high3.png";
import snakeHighImage from "@/sample-tattoos/detail-calibration-samples/high1.png";
import floralLowImage from "@/sample-tattoos/detail-calibration-samples/low2.png";
import geometricLowImage from "@/sample-tattoos/detail-calibration-samples/low3.png";
import snakeLowImage from "@/sample-tattoos/detail-calibration-samples/low1.png";
import floralMediumImage from "@/sample-tattoos/detail-calibration-samples/medium2.png";
import geometricMediumImage from "@/sample-tattoos/detail-calibration-samples/medium3.png";
import snakeMediumImage from "@/sample-tattoos/detail-calibration-samples/medium1.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicLocale } from "@/lib/i18n/public";
import {
  buildDetailCalibrationDebugSnapshot,
  createRandomizedDetailCalibrationOrder,
  DETAIL_CALIBRATION_SAMPLES,
  isDetailCalibrationSampleId,
  type DetailCalibrationSampleId,
  type DetailCalibrationSubmission,
} from "@/lib/pricing/detail-calibration";
import type {
  ArtistPricingRules,
  DetailCalibrationLevel,
  DetailCalibrationProfile,
} from "@/lib/types";

type DraftState = {
  sampleOrder: DetailCalibrationSampleId[];
  responses: Partial<Record<DetailCalibrationSampleId, DetailCalibrationLevel>>;
  currentIndex: number;
};

const sampleImages: Record<DetailCalibrationSampleId, StaticImageData> = {
  "snake-low": snakeLowImage,
  "floral-low": floralLowImage,
  "geometric-low": geometricLowImage,
  "snake-medium": snakeMediumImage,
  "floral-medium": floralMediumImage,
  "geometric-medium": geometricMediumImage,
  "snake-high": snakeHighImage,
  "floral-high": floralHighImage,
  "geometric-high": geometricHighImage,
};

function getCopy(locale: PublicLocale) {
  if (locale === "tr") {
    return {
      title: "Detay seviyesini birlikte ayarlayalım",
      description: "Sana birkaç örnek dövme göstereceğiz. Her biri için işçilik yoğunluğunu seç.",
      question: "Bu dövmenin işçilik yoğunluğu sana göre hangi seviyede?",
      progressLabel: "Görsel",
      start: "Detay seviyesini ayarla",
      edit: "Tekrar gözden geçir",
      reset: "Sıfırla",
      save: "Kaydet",
      saving: "Kaydediliyor",
      saved: "Detay profili kaydedildi.",
      saveFailed: "Detay seviyesi ayarı kaydedilemedi.",
      incomplete: "Tüm görselleri yanıtlaman gerekiyor.",
      completed: "9 görsel tamamlandı.",
      lastUpdated: "Son güncelleme",
      low: "Düşük detay",
      medium: "Orta detay",
      high: "Yüksek detay",
      back: "Geri",
      imageFallback: "Görsel yüklenemedi.",
      devDebug: "Debug verisi",
    };
  }

  return {
    title: "Tune detail level together",
    description: "You will see a few sample tattoos. Pick how dense the workmanship feels to you.",
    question: "How detailed does this tattoo feel to you?",
    progressLabel: "Sample",
    start: "Set detail level",
    edit: "Review again",
    reset: "Reset",
    save: "Save",
    saving: "Saving",
    saved: "Detail profile saved.",
    saveFailed: "Could not save the detail setup.",
    incomplete: "Please answer all samples first.",
    completed: "All 9 samples answered.",
    lastUpdated: "Last updated",
    low: "Low detail",
    medium: "Medium detail",
    high: "High detail",
    back: "Back",
    imageFallback: "Image could not be loaded.",
    devDebug: "Debug data",
  };
}

function buildDraftFromProfile(profile: DetailCalibrationProfile | null | undefined): DraftState {
  if (!profile) {
    return buildEmptyDraft();
  }

  const sampleOrder = profile.sampleOrder.filter(isDetailCalibrationSampleId);

  if (sampleOrder.length !== DETAIL_CALIBRATION_SAMPLES.length) {
    return buildEmptyDraft();
  }

  const responses = Object.fromEntries(
    profile.rawResponses
      .filter((response) => isDetailCalibrationSampleId(response.sampleId))
      .map((response) => [response.sampleId, response.selectedDetailLevel]),
  ) as Partial<Record<DetailCalibrationSampleId, DetailCalibrationLevel>>;

  return {
    sampleOrder,
    responses,
    currentIndex: 0,
  };
}

function buildEmptyDraft(): DraftState {
  return {
    sampleOrder: createRandomizedDetailCalibrationOrder(),
    responses: {},
    currentIndex: 0,
  };
}

function buildSubmissionPayload(draft: DraftState): DetailCalibrationSubmission {
  return {
    sampleOrder: draft.sampleOrder,
    responses: draft.sampleOrder.map((sampleId) => ({
      sampleId,
      selectedDetailLevel: draft.responses[sampleId]!,
    })),
  };
}

function normalizeStoredDraft(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<DraftState>;
    if (!parsed || !Array.isArray(parsed.sampleOrder)) {
      return null;
    }

    const validOrder = parsed.sampleOrder.filter((sampleId): sampleId is DetailCalibrationSampleId =>
      DETAIL_CALIBRATION_SAMPLES.some((sample) => sample.id === sampleId),
    );

    if (validOrder.length !== DETAIL_CALIBRATION_SAMPLES.length) {
      return null;
    }

    const responses = Object.fromEntries(
      Object.entries(parsed.responses ?? {}).filter(
        ([sampleId, selected]) =>
          DETAIL_CALIBRATION_SAMPLES.some((sample) => sample.id === sampleId) &&
          (selected === "low" || selected === "medium" || selected === "high"),
      ),
    ) as Partial<Record<DetailCalibrationSampleId, DetailCalibrationLevel>>;

    return {
      sampleOrder: validOrder,
      responses,
      currentIndex:
        typeof parsed.currentIndex === "number" && Number.isFinite(parsed.currentIndex)
          ? Math.max(0, Math.min(parsed.currentIndex, validOrder.length - 1))
          : 0,
    } satisfies DraftState;
  } catch {
    return null;
  }
}

function formatCompletedAt(value: string, locale: PublicLocale) {
  return new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function DetailCalibrationForm({
  pricingRules,
  locale = "en",
}: {
  pricingRules: ArtistPricingRules;
  locale?: PublicLocale;
}) {
  const router = useRouter();
  const copy = getCopy(locale);
  const storageKey = `tattix:detail-calibration:${pricingRules.artistId}`;
  const [savedProfile, setSavedProfile] = useState<DetailCalibrationProfile | null>(
    pricingRules.calibrationExamples.detailCalibration ?? null,
  );
  const [draft, setDraft] = useState<DraftState>(() =>
    buildDraftFromProfile(pricingRules.calibrationExamples.detailCalibration),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [failedSamples, setFailedSamples] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSavedProfile(pricingRules.calibrationExamples.detailCalibration ?? null);
  }, [pricingRules.calibrationExamples.detailCalibration]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedDraft = normalizeStoredDraft(window.localStorage.getItem(storageKey));
    if (storedDraft) {
      setDraft(storedDraft);
      if (Object.keys(storedDraft.responses).length > 0) {
        setIsOpen(true);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const responseCount = Object.keys(draft.responses).length;

    if (responseCount === 0 || (!isOpen && responseCount === DETAIL_CALIBRATION_SAMPLES.length)) {
      window.localStorage.removeItem(storageKey);
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft, isOpen, storageKey]);

  const answeredCount = Object.keys(draft.responses).length;
  const isComplete = answeredCount === DETAIL_CALIBRATION_SAMPLES.length;
  const currentSample = useMemo(() => {
    const currentSampleId = draft.sampleOrder[draft.currentIndex];
    return DETAIL_CALIBRATION_SAMPLES.find((sample) => sample.id === currentSampleId) ?? DETAIL_CALIBRATION_SAMPLES[0];
  }, [draft.currentIndex, draft.sampleOrder]);
  const debugSnapshot = useMemo(
    () => (savedProfile ? buildDetailCalibrationDebugSnapshot(savedProfile) : null),
    [savedProfile],
  );
  const isCurrentStepAnswered = Boolean(draft.responses[currentSample.id]);

  function handleStart() {
    setStatusMessage(null);
    setDraft((current) => {
      if (Object.keys(current.responses).length > 0) {
        return current;
      }

      return buildDraftFromProfile(savedProfile);
    });
    setIsOpen(true);
  }

  function handleRestart() {
    const nextDraft = buildEmptyDraft();

    setDraft(nextDraft);
    setStatusMessage(null);
    setIsOpen(true);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
  }

  async function persistDraft(nextDraft: DraftState) {
    const isDraftComplete = nextDraft.sampleOrder.every((sampleId) => Boolean(nextDraft.responses[sampleId]));

    if (!isDraftComplete) {
      setStatusMessage(copy.incomplete);
      return;
    }

    const payload = buildSubmissionPayload(nextDraft);
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/dashboard/pricing/detail-calibration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as
        | { message?: string; detailCalibration?: DetailCalibrationProfile }
        | null;

      if (!response.ok || !body?.detailCalibration) {
        setStatusMessage(body?.message ?? copy.saveFailed);
        return;
      }

      setSavedProfile(body.detailCalibration);
      setDraft(buildDraftFromProfile(body.detailCalibration));
      setIsOpen(false);
      setStatusMessage(copy.saved);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(storageKey);
      }
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  function handleSelection(level: DetailCalibrationLevel) {
    setStatusMessage(null);
    let nextDraftSnapshot: DraftState | null = null;

    setDraft((current) => {
      const currentSampleId = current.sampleOrder[current.currentIndex];
      const nextResponses = {
        ...current.responses,
        [currentSampleId]: level,
      };
      const nextIndex =
        current.currentIndex < current.sampleOrder.length - 1
          ? current.currentIndex + 1
          : current.currentIndex;
      const nextDraft = {
        ...current,
        responses: nextResponses,
        currentIndex: nextIndex,
      };

      nextDraftSnapshot = nextDraft;
      return nextDraft;
    });

    queueMicrotask(() => {
      if (!nextDraftSnapshot) {
        return;
      }

      const isCompleteNow = nextDraftSnapshot.sampleOrder.every((sampleId) =>
        Boolean(nextDraftSnapshot?.responses[sampleId]),
      );

      if (isCompleteNow) {
        void persistDraft(nextDraftSnapshot);
      }
    });
  }

  async function handleSave() {
    if (!isComplete) {
      setStatusMessage(copy.incomplete);
      return;
    }

    await persistDraft(draft);
  }

  return (
    <Card className="surface-border">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!isOpen ? (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" onClick={handleStart}>
                {savedProfile?.completed ? copy.edit : copy.start}
              </Button>
              <Button type="button" variant="ghost" onClick={handleRestart}>
                <RotateCcw className="size-4" />
                {copy.reset}
              </Button>
              {savedProfile?.completed ? (
                <Badge variant="muted">{copy.completed}</Badge>
              ) : null}
            </div>

            {savedProfile?.completed ? (
              <p className="text-sm text-[var(--foreground-muted)]">
                {copy.lastUpdated}: {formatCompletedAt(savedProfile.calibrationCompletedAt, locale)}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <Badge variant="muted">
                {copy.progressLabel} {Math.min(draft.currentIndex + 1, DETAIL_CALIBRATION_SAMPLES.length)} /{" "}
                {DETAIL_CALIBRATION_SAMPLES.length}
              </Badge>
              <Badge variant="muted">{answeredCount} / 9</Badge>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
              <div className="mx-auto max-w-[380px] overflow-hidden rounded-[22px] border border-white/8 bg-black/20">
                {!failedSamples[currentSample.id] ? (
                  <div className="relative aspect-square w-full bg-black/10">
                    <Image
                      src={sampleImages[currentSample.id]}
                      alt={copy.question}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 380px"
                      onError={() =>
                        setFailedSamples((current) => ({ ...current, [currentSample.id]: true }))
                      }
                    />
                  </div>
                ) : (
                  <div className="flex aspect-square items-center justify-center px-6 text-center text-sm text-[var(--foreground-muted)]">
                    {copy.imageFallback}
                  </div>
                )}
              </div>

              <p className="mt-4 text-base font-medium text-white">{copy.question}</p>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  { key: "low", label: copy.low },
                  { key: "medium", label: copy.medium },
                  { key: "high", label: copy.high },
                ].map((option) => {
                  const active = draft.responses[currentSample.id] === option.key;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleSelection(option.key as DetailCalibrationLevel)}
                      className="rounded-[18px] border px-4 py-3 text-sm transition"
                      style={{
                        borderColor: active ? "var(--accent)" : "rgba(255,255,255,0.08)",
                        backgroundColor: active
                          ? "color-mix(in srgb, var(--accent) 16%, transparent)"
                          : "rgba(255,255,255,0.02)",
                        color: "white",
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {isComplete ? (
              <div className="rounded-[24px] border border-white/8 bg-black/20 p-4">
                <p className="text-sm text-[var(--foreground-muted)]">{copy.completed}</p>
              </div>
            ) : null}

            {isCurrentStepAnswered && !isSaving ? (
              <div className="rounded-[20px] border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-3">
                <p className="text-sm text-white">
                  {locale === "tr" ? "Bu görsel tamamlandı." : "This sample is done."}
                </p>
              </div>
            ) : null}

            {statusMessage ? (
              <p className="text-sm text-[var(--accent-soft)]">{statusMessage}</p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              {draft.currentIndex > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      currentIndex: Math.max(0, current.currentIndex - 1),
                    }))
                  }
                >
                  <ArrowLeft className="size-4" />
                  {copy.back}
                </Button>
              ) : null}

              <Button type="button" variant="ghost" onClick={handleRestart}>
                <RotateCcw className="size-4" />
                {copy.reset}
              </Button>

              {isComplete ? (
                <Button type="button" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      {copy.saving}
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      {copy.save}
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </>
        )}

        {process.env.NODE_ENV !== "production" && debugSnapshot ? (
          <details className="rounded-[20px] border border-white/8 bg-black/20 p-4">
            <summary className="cursor-pointer text-sm text-white">{copy.devDebug}</summary>
            <pre className="mt-3 overflow-x-auto text-xs leading-6 text-[var(--foreground-muted)]">
              {JSON.stringify(debugSnapshot, null, 2)}
            </pre>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
