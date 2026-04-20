"use client";

import { create } from "zustand";

import type { EstimateResult, SubmissionDraft } from "@/lib/types";

type FunnelState = {
  step: number;
  draft: SubmissionDraft;
  result: EstimateResult | null;
  submitting: boolean;
  setField: <K extends keyof SubmissionDraft>(key: K, value: SubmissionDraft[K]) => void;
  nextStep: () => void;
  previousStep: () => void;
  setStep: (step: number) => void;
  setSubmitting: (submitting: boolean) => void;
  setResult: (result: EstimateResult | null) => void;
  reset: () => void;
};

const initialDraft: SubmissionDraft = {
  pricingSource: "",
  requestType: "",
  intent: "",
  selectedDesignId: "",
  referenceImage: "",
  referenceImagePath: "",
  referenceDescription: "",
  city: "",
  preferredStartDate: "",
  preferredEndDate: "",
  gender: "",
  ageRange: "",
  workStyle: "",
  bodyAreaGroup: "",
  bodyAreaDetail: "",
  sizeMode: "quick",
  approximateSizeCm: null,
  sizeCategory: "",
  widthCm: null,
  heightCm: null,
  detailLevel: "",
  colorMode: "",
  coverUp: null,
  notes: "",
};

export const useFunnelStore = create<FunnelState>((set) => ({
  step: 1,
  draft: initialDraft,
  result: null,
  submitting: false,
  setField: (key, value) =>
    set((state) => ({
      draft: {
        ...state.draft,
        [key]: value,
      },
    })),
  nextStep: () => set((state) => ({ step: Math.min(state.step + 1, 6) })),
  previousStep: () => set((state) => ({ step: Math.max(state.step - 1, 1) })),
  setStep: (step) => set({ step }),
  setSubmitting: (submitting) => set({ submitting }),
  setResult: (result) => set({ result }),
  reset: () =>
    set({
      step: 1,
      draft: initialDraft,
      result: null,
      submitting: false,
    }),
}));
