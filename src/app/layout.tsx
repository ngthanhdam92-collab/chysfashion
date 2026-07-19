import type { Metadata } from "next";
import { Playfair_Display, Be_Vietnam_Pro, Barlow_Condensed } from "next/font/google";
import Script from "next/script";
import { PixelScripts } from "@/components/pixel-scripts";
import { getPixelSettings } from "@/lib/pixel-settings";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-vietnam",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin", "vietnamese"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  weight: ["700", "800"],
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "CHYS Fashion — Thời trang cao cấp",
  description:
    "CHYS Fashion — thương hiệu thời trang cao cấp với thiết kế tối giản, tinh tế, chất liệu cao cấp dành cho phái mạnh và phái đẹp.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CHYS Admin",
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pixelSettings = await getPixelSettings();
  return (
    <html
      lang="vi"
      className={`${playfair.variable} ${beVietnamPro.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <head>
        <Script src="/polyfills.js" strategy="beforeInteractive" />
        <meta name="mobile-web-app-capable" content="yes" />
        {pixelSettings.fbDomainVerification && (
          <meta name="facebook-domain-verification" content={pixelSettings.fbDomainVerification} />
        )}
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=GT-MB8XH75V"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'GT-MB8XH75V');
          gtag('config', 'G-NB1QTZWJ2P');
        `}</Script>
        <PixelScripts
          fbPixelId={pixelSettings.fbPixelId || undefined}
          ttPixelId={pixelSettings.ttPixelId || undefined}
        />
        {children}
      </body>
    </html>
  );
}
