import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
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
    url: "https://terrasse.life",
    siteName: "Terrasse au Soleil",
    images: [
      {
        url: "/cover_photo.jpg",
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
      <head>
        <link rel="canonical" href="https://terrasse.life" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://terrasse.life" />
        <meta property="og:image" content="/cover_photo.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Terrasse au Soleil" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Terrasse au Soleil | Find Sun-Drenched Paris Terraces"
        />
        <meta
          name="twitter:description"
          content="Discover sunny bar terraces in Paris with Terrasse au Soleil."
        />
        <meta name="twitter:image" content="/cover_photo.jpg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Terrasse au Soleil",
              url: "https://terrasse.life",
              logo: "/globe.svg",
              description:
                "Discover sunny bar terraces in Paris with Terrasse au Soleil. Find the perfect sun-soaked spot for your coffee, drink or meal right now or at your chosen time.",
              sameAs: [
                "https://www.instagram.com/terrasseausoleil",
                "https://twitter.com/terrasseausoleil",
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} antialiased bg-white text-slate-900 min-h-screen`}
      >
        <AppProviders>{children}</AppProviders>
        <Analytics />
      </body>
    </html>
  );
}
