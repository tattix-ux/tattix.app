export const bodyPlacementGroups = [
  {
    value: "arm",
    label: "Arm",
    details: [
      { value: "upper-arm-outer", label: "Upper arm" },
      { value: "forearm-outer", label: "Lower arm" },
      { value: "wrist", label: "Wrist" },
      { value: "hand", label: "Hand" },
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
    ],
  },
  {
    value: "torso",
    label: "Torso",
    details: [
      { value: "chest-center", label: "Chest" },
      { value: "ribs", label: "Ribs" },
      { value: "stomach", label: "Stomach" },
    ],
  },
  {
    value: "back",
    label: "Back",
    details: [
      { value: "upper-back", label: "Upper back" },
      { value: "lower-back", label: "Lower back" },
      { value: "spine-area", label: "Spine" },
    ],
  },
  {
    value: "neck",
    label: "Neck",
    details: [
      { value: "neck-side", label: "Neck side" },
      { value: "neck-front", label: "Neck front" },
      { value: "neck-back", label: "Neck back" },
    ],
  },
  {
    value: "head",
    label: "Head",
    details: [{ value: "head", label: "Head" }],
  },
  {
    value: "hand",
    label: "Hand",
    details: [
      { value: "hand", label: "Hand" },
      { value: "fingers", label: "Fingers" },
    ],
  },
  {
    value: "foot",
    label: "Foot",
    details: [
      { value: "foot", label: "Foot" },
      { value: "toes", label: "Toes" },
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
