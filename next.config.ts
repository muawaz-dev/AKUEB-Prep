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
    const classLevelRedirects = Object.entries(oldToNewSlug).map(([oldSlug, newSlug]) => ({
      source: `/question-bank/${oldSlug}/:path*`,
      destination: `/question-bank/${newSlug}/:path*`,
      permanent: true,
    }));

    // There's no "Model Paper 2025" for either Class 11 subject - only
    // 2026 - so these 404. Redirect them to the real paper instead.
    const modelPaper2025Redirects = ["mathematics", "physics"].map((subject) => ({
      source: `/question-bank/class-11/${subject}/past-papers/model-paper-2025`,
      destination: `/question-bank/class-11/${subject}/past-papers/model-paper-2026`,
      permanent: true,
    }));

    return [...classLevelRedirects, ...modelPaper2025Redirects];
  },
};

export default nextConfig;
