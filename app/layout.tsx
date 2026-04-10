import type { Metadata } from "next";
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
      <body className="min-h-full overflow-x-hidden flex flex-col">
        <AuthStateListener />
        {children}
      </body>
    </html>
  );
}
