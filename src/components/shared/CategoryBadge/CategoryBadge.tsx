import { Badge, type BadgeTone } from "@/components/shared/Badge";
import type { Movement } from "@/schemas/wod";

const CATEGORY_TONES: Record<Movement["category"], BadgeTone> = {
  weightlifting: "amber",
  gymnastics: "sky",
  monostructural: "emerald",
  other: "neutral",
};

/** A movement's category (weightlifting, gymnastics, ...) as a colored badge. */
export function CategoryBadge({ category }: { category: Movement["category"] }) {
  return <Badge tone={CATEGORY_TONES[category]}>{category}</Badge>;
}
