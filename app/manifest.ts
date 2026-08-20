import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AKUEB Prep - Question Bank & Past Papers",
    short_name: "AKUEB Prep",
    description:
      "Free AKUEB question bank - chapter-wise MCQs and past papers with instant grading, for AKU-EB students.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#13265c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
