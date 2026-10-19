/** Words that make a stimulus sound hard, or easy. Kept to clear ones, so the hint rarely misfires. */
const HARD =
  /\b(all[\s-]?out|max(imal|imum)? effort|sprint|red[\s-]?line|redlin(e|ing)|super hard|very hard|brutal|grind|go hard|hard|intense|heavy|unbroken|fast)\b/i;
const EASY =
  /\b(easy|recovery|recover|flush|light|gentle|relaxed|conversational|mobility|cool[\s-]?down|zone 2|low intensity)\b/i;

/**
 * Whether a stimulus's words and its intensity clearly disagree, as when "super hard" is rated 1.
 * Only the clear cases: words that sound hard rated 3 or under, or that sound easy rated 8 or over
 * (and not both at once). Says which way the words lean ("hard" or "easy"), or null when they
 * agree or it can't tell.
 */
export function stimulusMismatch(description: string, intensity: number): "hard" | "easy" | null {
  const hard = HARD.test(description);
  const easy = EASY.test(description);
  if (hard && !easy && intensity <= 3) return "hard";
  if (easy && !hard && intensity >= 8) return "easy";
  return null;
}
