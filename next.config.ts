import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // Old class-level slugs (hssc-i, ssc-i, ...) permanently move to
    // class-N - see lib/slugFormat.ts. Keeps any already-indexed/linked
    // /question-bank/hssc-i/... URLs working instead of 404ing.
    const oldToNewSlug: Record<string, string> = {
      "ssc-i": "class-9",
      "ssc-ii": "class-10",
      "hssc-i": "class-11",
      "hssc-ii": "class-12",
    };
    return Object.entries(oldToNewSlug).map(([oldSlug, newSlug]) => ({
      source: `/question-bank/${oldSlug}/:path*`,
      destination: `/question-bank/${newSlug}/:path*`,
      permanent: true,
    }));
  },
};

export default nextConfig;
