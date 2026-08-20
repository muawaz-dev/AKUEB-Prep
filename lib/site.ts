// Falls back to the intended production domain so sitemap/robots/metadata
// URLs are correct even before NEXT_PUBLIC_SITE_URL is set in the deploy
// environment.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://akuebprep.com";
