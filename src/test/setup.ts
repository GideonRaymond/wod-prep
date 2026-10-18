import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Keep tests away from the real on-disk WOD cache; cache tests opt back in.
process.env.WOD_CACHE = "off";

// Don't let a saved workout leak from one test into the next.
afterEach(() => {
  if (typeof sessionStorage !== "undefined") sessionStorage.clear();
});
