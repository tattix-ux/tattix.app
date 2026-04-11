import type { Metadata, Viewport } from "next";
import { AuthStateListener } from "@/components/auth/auth-state-listener";
import "./globals.css";

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
      className="h-full antialiased"
      style={
        {
          "--font-body": '"Avenir Next", "Segoe UI", sans-serif',
          "--font-display": '"Iowan Old Style", "Palatino Linotype", serif',
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
