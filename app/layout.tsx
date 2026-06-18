import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

// Distinctive display + clean body, self-hosted (no external requests).
// Exposed as CSS variables consumed by globals.css tokens.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display-var",
  display: "swap",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-body-var",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Guys Trip",
  description: "Plan the trip: vote on places, pick weekends that work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
