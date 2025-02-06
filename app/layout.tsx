import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Image from "next/image";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

function MobileWarning() {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center text-white p-6 md:hidden">
      <div className="max-w-md text-center space-y-4">
        <div className="w-20 h-20 mx-auto relative">
          <Image
            src="/nvg.svg"
            alt="Navigate Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h2 className="text-2xl font-bold">Desktop Experience Required</h2>
        <p className="text-gray-400">
          Cards Against Singularity is designed for desktop use. Please switch to a computer for the best experience.
        </p>
        <p className="text-sm text-orange-500">
          Built by{" "}
          <a 
            href="https://nvg8.io" 
            className="underline hover:text-orange-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            Navigate
          </a>
        </p>
      </div>
    </div>
  );
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Cards Against Singularity | Navigate",
  description: "A parody game inspired by Cards Against Humanity, powered by Navigate - The Data Marketplace for AI Agents on Base.",
  keywords: ["AI", "blockchain", "card game", "Navigate", "Base", "web3", "data marketplace"],
  authors: [{ name: "Navigate" }],
  creator: "Navigate",
  publisher: "Navigate",
  metadataBase: new URL("https://nvg8.io"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nvg8.io",
    title: "Cards Against Singularity | Navigate",
    description: "A parody game inspired by Cards Against Humanity, powered by Navigate - The Data Marketplace for AI Agents on Base.",
    siteName: "Navigate",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "Navigate - The Data Marketplace for AI Agents on Base",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cards Against Singularity | Navigate",
    description: "A parody game inspired by Cards Against Humanity, powered by Navigate - The Data Marketplace for AI Agents on Base.",
    creator: "@navigate_ai",
    images: ["/banner.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#000000",
      },
    ],
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cards Against Singularity",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.className}`}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="antialiased bg-[#111111]">
        <MobileWarning />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
