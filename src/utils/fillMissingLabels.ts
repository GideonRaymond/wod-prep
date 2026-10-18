type Labelled = { label: string | null };

const LETTER = /^[a-z]$/i;

/**
 * Makes sure every part of a multi-part WOD has a label. If any part is missing one, the lettered
 * parts are re-lettered A, B, C… in order, so "Nancy, then part B: Murph" becomes A and B.
 * Descriptive labels like "Cool-down" or "Strength" are kept and don't use up a letter.
 * A single-part WOD is left as is (no label).
 */
export function fillMissingLabels<T extends Labelled>(parts: T[]): T[] {
  if (parts.length < 2 || parts.every((part) => part.label)) return parts;

  let letters = 0;
  return parts.map((part) => {
    if (part.label && !LETTER.test(part.label)) return part;
    return { ...part, label: String.fromCharCode(65 + letters++) };
  });
}
