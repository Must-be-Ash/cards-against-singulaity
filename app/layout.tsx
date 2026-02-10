import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
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
  title: "Cards Against Singularity",
  description: "A parody card game inspired by Cards Against Humanity, focused on AI and tech humor.",
  keywords: ["AI", "card game", "parody", "tech humor", "singularity"],
  authors: [{ name: "@Must_be_Ash" }],
  creator: "@Must_be_Ash",
  publisher: "@Must_be_Ash",
  metadataBase: new URL("https://cards-against-singulaity.vercel.app/"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cards-against-singulaity.vercel.app/",
    title: "Cards Against Singularity",
    description: "A parody card game inspired by Cards Against Humanity, focused on AI and tech humor.",
    siteName: "Cards Against Singularity",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Cards Against Singularity - A parody card game for AI humor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cards Against Singularity",
    description: "A parody card game inspired by Cards Against Humanity, focused on AI and tech humor.",
    creator: "@Must_be_Ash",
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="msapplication-TileColor" content="#0000FF" />
        <meta name="theme-color" content="#0000FF" />
      </head>
      <body className="antialiased bg-[#111111]">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
