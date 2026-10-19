import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the browser know about MOCK_LOAD too, so mock mode can skip the countdown to the class.
  env: { MOCK_LOAD: process.env.MOCK_LOAD ?? "" },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
