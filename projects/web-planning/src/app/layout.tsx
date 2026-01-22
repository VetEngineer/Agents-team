import type { Metadata } from "next";
import {
  IBM_Plex_Sans_KR,
  JetBrains_Mono,
  Noto_Sans_KR,
} from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans_KR({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSans = Noto_Sans_KR({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "웹플래너 워크스페이스",
  description: "설문 기반 웹사이트 기획 워크스페이스",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"
  ),
  icons: {
    icon: [
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "웹플래너 워크스페이스",
    description: "설문 기반 웹사이트 기획 워크스페이스",
    images: [
      {
        url: "/brand/og-hakham.jpg",
        width: 1200,
        height: 630,
        alt: "하감솔루션",
      },
    ],
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "웹플래너 워크스페이스",
    description: "설문 기반 웹사이트 기획 워크스페이스",
    images: ["/brand/og-hakham.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${plexSans.variable} ${notoSans.variable} ${mono.variable}`}>
        {children}
      </body>
    </html>
  );
}
