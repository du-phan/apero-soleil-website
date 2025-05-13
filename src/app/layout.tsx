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
  title: "Terrasse au Soleil | Où boire un verre au soleil à Paris ?",
  description:
    "Trouvez une terrasse ensoleillée à Paris aujourd'hui ! Terrasse au Soleil vous aide à découvrir où boire un verre au soleil, profiter d'un café ou d'un repas sur une terrasse ensoleillée à Paris, en temps réel.",
  openGraph: {
    title: "Terrasse au Soleil | Où boire un verre au soleil à Paris ?",
    description:
      "Découvrez les meilleures terrasses ensoleillées de Paris pour boire un verre au soleil aujourd'hui. Guide local et carte interactive.",
    url: "https://terrasse.life",
    siteName: "Terrasse au Soleil",
    images: [
      {
        url: "/cover_photo.jpg",
        width: 1200,
        height: 630,
        alt: "Photo d'une terrasse ensoleillée à Paris avec des gens qui boivent un verre au soleil.",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <link rel="canonical" href="https://terrasse.life" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="alternate" href="https://terrasse.life" hrefLang="fr" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://terrasse.life" />
        <meta property="og:image" content="/cover_photo.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="Photo d'une terrasse ensoleillée à Paris avec des gens qui boivent un verre au soleil."
        />
        <meta
          property="og:title"
          content="Terrasse au Soleil | Où boire un verre au soleil à Paris ?"
        />
        <meta
          property="og:description"
          content="Découvrez les meilleures terrasses ensoleillées de Paris pour boire un verre au soleil aujourd'hui. Guide local et carte interactive."
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Terrasse au Soleil | Où boire un verre au soleil à Paris ?"
        />
        <meta
          name="twitter:description"
          content="Trouvez une terrasse ensoleillée à Paris aujourd'hui ! Terrasse au Soleil vous aide à découvrir où boire un verre au soleil, profiter d'un café ou d'un repas sur une terrasse ensoleillée à Paris, en temps réel."
        />
        <meta name="twitter:image" content="/cover_photo.jpg" />
        <meta
          name="twitter:image:alt"
          content="Photo d'une terrasse ensoleillée à Paris avec des gens qui boivent un verre au soleil."
        />
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
                "Trouvez une terrasse ensoleillée à Paris aujourd'hui ! Terrasse au Soleil vous aide à découvrir où boire un verre au soleil, profiter d'un café ou d'un repas sur une terrasse ensoleillée à Paris, en temps réel.",
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
