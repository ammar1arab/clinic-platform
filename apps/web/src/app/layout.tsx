import { cookies } from "next/headers";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Alexandria } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/providers";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-latin",
  display: "swap",
});

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cureva Clinic",
  description: "Cureva Clinic",
  icons: {
    icon: "/brand/cureva-mark.png",
    apple: "/brand/cureva-mark.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = (await cookies()).get("language")?.value === "ar" ? "ar" : "en";
  return (
    <html
      lang={language}
      dir={language === "ar" ? "rtl" : "ltr"}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${jakarta.variable} ${alexandria.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var l=localStorage.getItem('language');if(l==='ar'||l==='en'){document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';document.cookie='language='+l+';path=/;max-age=31536000;samesite=lax'}if(localStorage.getItem('sidebar-collapsed')==='true')document.documentElement.setAttribute('data-sidebar','collapsed')}catch(e){}",
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <AppProviders initialLanguage={language}>{children}</AppProviders>
      </body>
    </html>
  );
}
