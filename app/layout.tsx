import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

// Self-hosted, exposed as a CSS variable so the design tokens in globals.css
// (--font-body / --font-display) stay the single source of truth.
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
});

export const metadata: Metadata = {
  title: "Goon Trip",
  description: "Plan the trip: vote on places, pick weekends that work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={hanken.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
