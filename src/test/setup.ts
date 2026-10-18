import "@testing-library/jest-dom/vitest";

// Keep tests away from the real on-disk WOD cache; cache tests opt back in.
process.env.WOD_CACHE = "off";
