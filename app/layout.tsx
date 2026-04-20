import type { Metadata, Viewport } from "next";
import { DM_Sans, Inter, Manrope } from "next/font/google";
import { AuthStateListener } from "@/components/auth/auth-state-listener";
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

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tattix",
    template: "%s | Tattix",
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
      className={`h-full antialiased ${inter.variable} ${manrope.variable} ${dmSans.variable}`}
      style={
        {
          "--font-body": 'var(--font-inter), "Inter", "Segoe UI", sans-serif',
          "--font-display": 'var(--font-manrope), "Manrope", "Segoe UI", sans-serif',
          "--font-mono": '"SFMono-Regular", "Consolas", monospace',
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
