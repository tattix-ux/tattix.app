import type {
  FinalControlPlacementType,
  FinalControlProbeType,
  PricingValidationExampleId,
} from "../types.ts";

export type FinalControlProbe = {
  id: PricingValidationExampleId;
  imagePath: string;
  label: string;
  probeType: FinalControlProbeType;
  assumedSizeCm: number;
  assumedPlacementType: FinalControlPlacementType;
  notes: string;
};

export const CURRENT_DAGGER_ANCHOR_IMAGE_PATH = "sample-tattoos/final-control/dagger.png";

export const FINAL_CONTROL_PROBES: FinalControlProbe[] = [
  {
    id: "text-low-boundary",
    imagePath: "sample-tattoos/final-control/text.png",
    label: "Text visual",
    probeType: "low_boundary",
    assumedSizeCm: 9,
    assumedPlacementType: "easy_flat",
    notes: "low effort / simple fine-line probe",
  },
  {
    id: "colored-butterfly",
    imagePath: "sample-tattoos/final-control/butterfly.png",
    label: "Colored butterfly",
    probeType: "color",
    assumedSizeCm: 18,
    assumedPlacementType: "easy_flat",
    notes: "color factor probe",
  },
  {
    id: "current-dagger",
    imagePath: CURRENT_DAGGER_ANCHOR_IMAGE_PATH,
    label: "Current dagger",
    probeType: "baseline",
    assumedSizeCm: 18,
    assumedPlacementType: "easy_flat",
    notes: "medium baseline / non-floral anchor",
  },
  {
    id: "feather-high-detail",
    imagePath: "sample-tattoos/final-control/feather.png",
    label: "Feather",
    probeType: "high_detail",
    assumedSizeCm: 18,
    assumedPlacementType: "easy_flat",
    notes: "high detail linework probe",
  },
  {
    id: "realistic-eye",
    imagePath: "sample-tattoos/final-control/realistic eye.png",
    label: "Realistic eye",
    probeType: "style",
    assumedSizeCm: 18,
    assumedPlacementType: "easy_flat",
    notes: "realistic / style premium probe",
  },
] as const;
