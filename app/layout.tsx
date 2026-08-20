import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_NAME = "AKUEB Prep";
const TITLE = "AKUEB Prep - Question Bank & Past Papers";
const DESCRIPTION =
  "Free AKUEB question bank - chapter-wise MCQs and past papers with instant grading, for AKU-EB students.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | AKUEB Prep",
  },
  description: DESCRIPTION,
  keywords: [
    "AKUEB",
    "AKU-EB",
    "Aga Khan University Examination Board",
    "AKUEB past papers",
    "AKUEB question bank",
    "AKUEB MCQs",
    "HSSC 1 past papers",
    "FSc 1 past papers",
    "AKUEB Mathematics",
    "AKUEB Physics",
  ],
  authors: [{ name: SITE_NAME }],
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#13265c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-dvh antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
