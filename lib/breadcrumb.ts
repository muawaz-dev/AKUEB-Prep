import { SITE_URL } from "./site";

export type BreadcrumbItem = { name: string; url: string };

// Mirrors the "back" links already rendered on each question-bank page
// (QuestionBankPageBody's backHref) - same hierarchy, just as JSON-LD so
// Google can show it in the search snippet instead of a raw URL.
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };
}
