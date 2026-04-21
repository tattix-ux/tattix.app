type PlacementScopeValue = "standard_piece" | "large_single_area" | "wide_area" | "unsure";

export const bodyPlacementGroups = [
  {
    value: "arm",
    label: "Arm",
    details: [
      { value: "upper-arm-outer", label: "Upper arm" },
      { value: "forearm-outer", label: "Lower arm" },
      { value: "wrist", label: "Wrist" },
      { value: "arm-other", label: "Others" },
    ],
  },
  {
    value: "leg",
    label: "Leg",
    details: [
      { value: "thigh-front", label: "Upper leg" },
      { value: "calf", label: "Lower leg" },
      { value: "ankle", label: "Ankle" },
      { value: "foot", label: "Foot" },
      { value: "leg-other", label: "Others" },
    ],
  },
  {
    value: "torso",
    label: "Torso",
    details: [
      { value: "chest-center", label: "Chest" },
      { value: "ribs", label: "Ribs" },
      { value: "stomach", label: "Stomach" },
      { value: "torso-other", label: "Others" },
    ],
  },
  {
    value: "back",
    label: "Back",
    details: [
      { value: "upper-back", label: "Upper back" },
      { value: "lower-back", label: "Lower back" },
      { value: "spine-area", label: "Spine" },
      { value: "back-other", label: "Others" },
    ],
  },
  {
    value: "neck",
    label: "Neck",
    details: [
      { value: "neck-side", label: "Neck side" },
      { value: "neck-front", label: "Neck front" },
      { value: "neck-back", label: "Neck back" },
      { value: "neck-other", label: "Others" },
    ],
  },
  {
    value: "head",
    label: "Head",
    details: [
      { value: "head", label: "Head" },
      { value: "head-other", label: "Others" },
    ],
  },
  {
    value: "hand",
    label: "Hand",
    details: [
      { value: "hand", label: "Hand" },
      { value: "fingers", label: "Fingers" },
      { value: "hand-other", label: "Others" },
    ],
  },
  {
    value: "foot",
    label: "Foot",
    details: [
      { value: "foot", label: "Foot" },
      { value: "toes", label: "Toes" },
      { value: "foot-other", label: "Others" },
    ],
  },
  {
    value: "not-sure",
    label: "I'm not sure",
    details: [{ value: "placement-not-sure", label: "I'm not sure" }],
  },
] as const;

export const placementCategoryOptions = bodyPlacementGroups.map((group) => ({
  value: group.value,
  label: group.label,
  group: group.value,
  description: "",
  details: group.details.map((detail) => detail.value),
})) as readonly {
  value: (typeof bodyPlacementGroups)[number]["value"];
  label: string;
  group: (typeof bodyPlacementGroups)[number]["value"];
  description: string;
  details: readonly (typeof bodyPlacementGroups)[number]["details"][number]["value"][];
}[];

export type BodyAreaGroupValue = (typeof bodyPlacementGroups)[number]["value"];
export type BodyAreaDetailValue =
  (typeof bodyPlacementGroups)[number]["details"][number]["value"];
export type PlacementCategoryValue = (typeof placementCategoryOptions)[number]["value"];

export function getPlacementGroupLabel(value: string) {
  return bodyPlacementGroups.find((group) => group.value === value)?.label ?? value;
}

export function getPlacementDetailLabel(value: string) {
  for (const group of bodyPlacementGroups) {
    const detail = group.details.find((item) => item.value === value);
    if (detail) {
      return detail.label;
    }
  }

  return value;
}

export function getPlacementCategoryByDetail(detailValue: BodyAreaDetailValue | "") {
  if (!detailValue) {
    return null;
  }

  return (
    placementCategoryOptions.find((category) =>
      (category.details as readonly BodyAreaDetailValue[]).includes(detailValue),
    ) ?? null
  );
}

const placementDetailsByAreaScope: Record<
  PlacementScopeValue,
  Partial<Record<BodyAreaGroupValue, readonly BodyAreaDetailValue[]>>
> = {
  standard_piece: {
    arm: ["upper-arm-outer", "forearm-outer", "wrist", "arm-other"],
    leg: ["thigh-front", "calf", "ankle", "leg-other"],
    torso: ["chest-center", "ribs", "stomach", "torso-other"],
    neck: ["neck-side", "neck-front", "neck-back", "neck-other"],
    head: ["head", "head-other"],
    hand: ["hand", "fingers", "hand-other"],
    foot: ["foot", "toes", "foot-other"],
    "not-sure": ["placement-not-sure"],
  },
  large_single_area: {
    arm: ["upper-arm-outer", "forearm-outer", "arm-other"],
    leg: ["thigh-front", "calf", "leg-other"],
    torso: ["chest-center", "ribs", "stomach", "torso-other"],
    "not-sure": ["placement-not-sure"],
  },
  wide_area: {
    arm: ["upper-arm-outer", "forearm-outer", "arm-other"],
    leg: ["thigh-front", "calf", "leg-other"],
    torso: ["chest-center", "ribs", "stomach", "torso-other"],
    back: ["upper-back", "lower-back", "spine-area", "back-other"],
    "not-sure": ["placement-not-sure"],
  },
  unsure: bodyPlacementGroups.reduce(
    (acc, group) => {
      acc[group.value] = group.details.map((detail) => detail.value);
      return acc;
    },
    {} as Record<BodyAreaGroupValue, readonly BodyAreaDetailValue[]>,
  ),
};

export function getPlacementCategoriesForAreaScope(areaScope: PlacementScopeValue | "") {
  const resolvedScope = areaScope || "unsure";
  const scopedGroups = placementDetailsByAreaScope[resolvedScope] ?? placementDetailsByAreaScope.unsure;

  return bodyPlacementGroups
    .filter((group) => {
      const allowedDetails = scopedGroups[group.value];
      return Boolean(allowedDetails?.length);
    })
    .map((group) => {
      const allowedDetails = scopedGroups[group.value] ?? [];
      return {
        ...group,
        details: group.details
          .filter((detail) => allowedDetails.includes(detail.value)),
      };
    })
    .filter((group) => group.details.length > 0);
}

export function isPlacementGroupAllowedForAreaScope(
  groupValue: BodyAreaGroupValue | "",
  areaScope: PlacementScopeValue | "",
) {
  if (!groupValue) {
    return true;
  }

  return getPlacementCategoriesForAreaScope(areaScope).some((group) => group.value === groupValue);
}

export function isPlacementDetailAllowedForAreaScope(
  detailValue: BodyAreaDetailValue | "",
  areaScope: PlacementScopeValue | "",
) {
  if (!detailValue) {
    return true;
  }

  return getPlacementCategoriesForAreaScope(areaScope).some((group) =>
    group.details.some((detail) => detail.value === detailValue),
  );
}
