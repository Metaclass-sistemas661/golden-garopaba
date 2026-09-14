import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

// =============================================================================
// Site Configuration Constants
// =============================================================================
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://goldengaropaba.com.br";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "Golden Garopaba";

// =============================================================================
// Viewport Configuration
// =============================================================================
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// =============================================================================
// Enterprise-Grade Metadata Configuration
// =============================================================================
export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} | Imóveis de Luxo em Garopaba`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "A principal imobiliária de luxo em Garopaba, SC. Mansões exclusivas, coberturas espetaculares e investimentos premium no litoral catarinense.",
  keywords: [
    "imóveis de luxo Garopaba",
    "mansões Garopaba",
    "imobiliária alto padrão Santa Catarina",
    "Golden Garopaba",
    "imóveis exclusivos SC",
  ],
  authors: [{ name: "Golden Garopaba", url: SITE_URL }],
  creator: "Golden Garopaba",
  publisher: "Golden Garopaba",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} | Imóveis de Luxo em Garopaba`,
    description: "A principal imobiliária de luxo em Garopaba. Mansões exclusivas e investimentos premium.",
    images: [{ url: `${SITE_URL}/og-image.jpg`, width: 1200, height: 630, alt: "Golden Garopaba" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Imóveis de Luxo em Garopaba`,
    description: "Mansões exclusivas e coberturas espetaculares no litoral catarinense.",
    images: [`${SITE_URL}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  applicationName: SITE_NAME,
  category: "Real Estate",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/favicon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
};

import SmoothScrolling from "@/components/SmoothScrolling";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://ynvcktbpbvappvcynpfe.supabase.co" />
        <link rel="dns-prefetch" href="https://ynvcktbpbvappvcynpfe.supabase.co" />
      </head>
      <body>
        <SmoothScrolling>{children}</SmoothScrolling>
      </body>
    </html>
  );
}
