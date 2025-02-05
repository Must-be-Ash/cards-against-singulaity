import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Cards Against Singularity | Navigate",
  description: "A humorous card game about AI and blockchain, powered by Navigate - The Data Marketplace for AI Agents on Base.",
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
    description: "A humorous card game about AI and blockchain, powered by Navigate - The Data Marketplace for AI Agents on Base.",
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
    description: "A humorous card game about AI and blockchain, powered by Navigate - The Data Marketplace for AI Agents on Base.",
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
    <html lang="en" className={inter.className}>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
