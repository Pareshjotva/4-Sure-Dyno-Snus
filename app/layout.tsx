import type { Metadata } from "next";
import { Bebas_Neue, Bangers, Outfit } from "next/font/google";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const brand = Bangers({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-brand",
  display: "swap",
});

const body = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://4sureinternational.ca"
  ),
  title: {
    default: "Dyno Snus | 4 Sure International",
    template: "%s | Dyno Snus · 4 Sure International",
  },
  description:
    "Dyno Snus premium slim pouches for licensed adult tobacco retailers in Canada. Dyno Extreme and Dyno Blast from 4 Sure International.",
  keywords: [
    "Dyno Snus",
    "4 Sure International",
    "wholesale snus",
    "Dyno Extreme",
    "Dyno Blast",
    "B2B tobacco Canada",
  ],
  openGraph: {
    title: "Dyno Snus | 4 Sure International",
    description:
      "Premium Scandinavian snus for licensed Canadian retailers. Extreme Slim and Blast White Slim.",
    type: "website",
    locale: "en_CA",
    images: [{ url: "/images/dyno-products-hero.jpg" }],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-CA">
      <body
        className={`${display.variable} ${brand.variable} ${body.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
