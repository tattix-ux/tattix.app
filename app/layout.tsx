import type { Metadata, Viewport } from "next";
import {
  Cormorant_Garamond,
  Courier_Prime,
  DM_Sans,
  IBM_Plex_Mono,
  Inter,
  JetBrains_Mono,
  Libre_Baskerville,
  Manrope,
  Playfair_Display,
  Plus_Jakarta_Sans,
  Poppins,
  Source_Sans_3,
  Space_Grotesk,
} from "next/font/google";
import { AuthStateListener } from "@/components/auth/auth-state-listener";
import { siteConfig } from "@/lib/config/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const playfairDisplay = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair-display", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const sourceSans3 = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans-3", display: "swap" });
const cormorantGaramond = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-cormorant-garamond", display: "swap" });
const libreBaskerville = Libre_Baskerville({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-libre-baskerville", display: "swap" });
const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-plus-jakarta-sans", display: "swap" });
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-poppins", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const courierPrime = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-courier-prime", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-ibm-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Tattix",
    template: "%s | Tattix",
  },
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
    apple: "/apple-icon.png",
  },
  description:
    "Tattix is a mobile-first link-in-bio funnel and tattoo pricing estimator for tattoo artists.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${inter.variable} ${manrope.variable} ${playfairDisplay.variable} ${spaceGrotesk.variable} ${sourceSans3.variable} ${cormorantGaramond.variable} ${libreBaskerville.variable} ${plusJakartaSans.variable} ${poppins.variable} ${dmSans.variable} ${courierPrime.variable} ${jetbrainsMono.variable} ${ibmPlexMono.variable}`}
      style={
        {
          "--font-body": 'var(--font-inter), "Inter", "Segoe UI", sans-serif',
          "--font-display": 'var(--font-manrope), "Manrope", "Segoe UI", sans-serif',
          "--font-mono": 'var(--font-jetbrains-mono), "SFMono-Regular", "Consolas", monospace',
        } as React.CSSProperties
      }
    >
      <body className="flex min-h-full w-full max-w-full flex-col overflow-x-hidden overflow-y-auto">
        <AuthStateListener />
        {children}
      </body>
    </html>
  );
}
