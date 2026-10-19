import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

// next/font only works inside a Next.js build; tests get a plain class name per font.
vi.mock("next/font/google", () => ({
  Permanent_Marker: () => ({ className: "font-permanent-marker" }),
  Kalam: () => ({ className: "font-kalam" }),
}));

// Keep tests away from the real on-disk WOD cache; cache tests opt back in.
process.env.WOD_CACHE = "off";

// Don't let a saved workout leak from one test into the next.
afterEach(() => {
  if (typeof sessionStorage !== "undefined") sessionStorage.clear();
});
