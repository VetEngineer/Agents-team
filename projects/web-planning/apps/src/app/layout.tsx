import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Web Planning Wizard",
  description: "Survey + builder flow for a web planning brief.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={roboto.variable}>
      <body>{children}</body>
    </html>
  );
}
