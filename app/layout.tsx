import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
