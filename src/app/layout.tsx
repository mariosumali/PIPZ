import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { pipzDescription, pipzTitle } from "@/lib/pipz-brand";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteOrigin =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

const siteUrl = siteOrigin.startsWith("http")
  ? siteOrigin
  : `https://${siteOrigin}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "PIPZ",
  title: pipzTitle,
  description: pipzDescription,
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/pipz-logo.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-icon",
  },
  openGraph: {
    title: pipzTitle,
    description: pipzDescription,
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "PIPZ black-and-white dice cube logo.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: pipzTitle,
    description: pipzDescription,
    images: [
      {
        url: "/twitter-image",
        alt: "PIPZ black-and-white dice cube logo.",
      },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#f0ebe3] font-sans overflow-hidden">
        {children}
      </body>
    </html>
  );
}
