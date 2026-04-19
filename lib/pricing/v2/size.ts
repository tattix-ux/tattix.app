import type { SizeValue } from "@/lib/constants/options";
import type { SubmissionRequest } from "@/lib/types";

const CATEGORY_DEFAULTS: Record<SizeValue, number> = {
  tiny: 4,
  small: 8,
  medium: 13,
  large: 20,
};

export function resolveRepresentativeSizeCm(submission: SubmissionRequest) {
  if (
    typeof submission.approximateSizeCm === "number" &&
    Number.isFinite(submission.approximateSizeCm) &&
    submission.approximateSizeCm > 0
  ) {
    return submission.approximateSizeCm;
  }

  const width =
    typeof submission.widthCm === "number" && Number.isFinite(submission.widthCm)
      ? submission.widthCm
      : null;
  const height =
    typeof submission.heightCm === "number" && Number.isFinite(submission.heightCm)
      ? submission.heightCm
      : null;

  if (width && height) {
    return Math.max(width, height);
  }

  if (width) {
    return width;
  }

  return CATEGORY_DEFAULTS[submission.sizeCategory] ?? 8;
}

export function deriveSizeCategoryFromCm(sizeCm: number): SizeValue {
  if (sizeCm <= 5) {
    return "tiny";
  }

  if (sizeCm <= 10) {
    return "small";
  }

  if (sizeCm <= 18) {
    return "medium";
  }

  return "large";
}
