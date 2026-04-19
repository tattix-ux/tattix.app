import type { BodyAreaDetailValue } from "@/lib/constants/body-placement";
import type { PlacementBucket } from "./types";

const HARD_PLACEMENTS = new Set<BodyAreaDetailValue>([
  "hand",
  "fingers",
  "hand-other",
  "neck-front",
  "neck-side",
  "neck-back",
  "neck-other",
  "ribs",
  "stomach",
  "head",
  "head-other",
]);

const STANDARD_PLACEMENTS = new Set<BodyAreaDetailValue>([
  "wrist",
  "ankle",
  "foot",
  "toes",
  "foot-other",
  "spine-area",
  "chest-center",
  "placement-not-sure",
]);

export function resolvePlacementBucket(placement: BodyAreaDetailValue): PlacementBucket {
  if (HARD_PLACEMENTS.has(placement)) {
    return "hard";
  }

  if (STANDARD_PLACEMENTS.has(placement)) {
    return "standard";
  }

  return "easy";
}
