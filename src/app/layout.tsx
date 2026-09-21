import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/toast";
import { GuestCartMerger } from "@/components/cart/guest-cart-merger";
import { SITE_URL } from "@/config/constants";
import "./globals.css";

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--ayli-font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--ayli-font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "AYLI — Women's Fashion, Elevated",
    template: "%s | AYLI",
  },
  description:
    "AYLI is a premium women's fashion destination — kurtis, co-ord sets, dresses & more, made for the modern Indian woman.",
  applicationName: "AYLI",
  keywords: [
    "women's fashion",
    "kurtis",
    "co-ord sets",
    "dresses",
    "kurta sets",
    "bottoms",
    "indian fashion",
  ],
  authors: [{ name: "AYLI" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "AYLI",
    title: "AYLI — Women's Fashion, Elevated",
    description:
      "AYLI is a premium women's fashion destination — kurtis, co-ord sets, dresses & more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AYLI — Women's Fashion, Elevated",
    description: "Premium women's fashion for the modern Indian woman.",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFCFD",
  width: "device-width",
  initialScale: 1,
};

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-pill focus:bg-plum focus:px-4 focus:py-2 focus:text-warm-white"
    >
      Skip to content
    </a>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${cormorantGaramond.variable} ${dmSans.variable}`}
    >
      <body className="flex min-h-dvh flex-col antialiased">
        <SessionProvider>
          <ToastProvider>
            <SkipLink />
            {children}
            <GuestCartMerger />
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
