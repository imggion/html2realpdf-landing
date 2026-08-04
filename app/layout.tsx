import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { NextProvider } from "fumadocs-core/framework/next";
import { siteConfig, siteUrl } from "@/lib/site";
import "./globals.css";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: "imggion", url: "https://github.com/imggion" }],
  creator: "imggion",
  publisher: "imggion",
  category: "Developer Tools",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  alternates: {
    canonical: siteUrl.toString(),
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl.toString(),
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: "/opengraph-image.png",
        width: 1280,
        height: 720,
        alt: "html2realpdf browser HTML-to-PDF library logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: "/opengraph-image.png",
        alt: "html2realpdf browser HTML-to-PDF library logo",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#122445",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={jetBrainsMono.variable}
      data-scroll-behavior="smooth"
    >
      <body>
        <NextProvider>{children}</NextProvider>
        <Analytics />
      </body>
    </html>
  );
}
