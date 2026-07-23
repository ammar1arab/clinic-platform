import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-clinic",
  display: "swap",
});

/**
 * FUTURE (web growth / ops — not wired yet):
 * - SEO: richer metadata, OG tags, sitemap, robots, JSON-LD
 * - Sentry, Microsoft Clarity, Google Analytics (GA4), Vercel Analytics
 * - Firebase Cloud Messaging for browser push
 */
export const metadata: Metadata = {
  title: "Clinic Platform",
  description: "Clinic Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={jakarta.variable}
    >
      <body className="font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
