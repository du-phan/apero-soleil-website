import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import AppProviders from "@/contexts/AppProviders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Terrasse au Soleil | Find Sun-Drenched Paris Terraces",
  description:
    "Discover sunny bar terraces in Paris with Terrasse au Soleil. Find the perfect sun-soaked spot for your coffee, drink or meal right now or at your chosen time.",
  openGraph: {
    title: "Terrasse au Soleil | Find Sun-Drenched Paris Terraces",
    description:
      "Discover sunny bar terraces in Paris with Terrasse au Soleil.",
    url: "https://terrasse-au-soleil.vercel.app",
    siteName: "Terrasse au Soleil",
    images: [
      {
        url: "https://terrasse-au-soleil.vercel.app/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Terrasse au Soleil",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-white text-slate-900 min-h-screen`}
      >
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
