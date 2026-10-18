import { Badge, type BadgeTone } from "@/components/shared/Badge";
import type { Movement } from "@/schemas/wod";

const CATEGORY_TONES: Record<Movement["category"], BadgeTone> = {
  weightlifting: "deep",
  gymnastics: "mid",
  monostructural: "pale",
  other: "neutral",
};

export type CategoryBadgeProps = {
  category: Movement["category"];
  /** Text to show instead of the category, e.g. the movement's name, still in the category's shade. */
  label?: string;
};

/** A movement's category (weightlifting, gymnastics, ...) as a badge in its shade of purple. */
export function CategoryBadge({ category, label }: CategoryBadgeProps) {
  return (
    <Badge tone={CATEGORY_TONES[category]} title={label ? category : undefined}>
      {label ?? category}
    </Badge>
  );
}
