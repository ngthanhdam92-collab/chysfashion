import type { Metadata } from "next";
import { Playfair_Display, Be_Vietnam_Pro } from "next/font/google";
import Script from "next/script";
import { PixelScripts } from "@/components/pixel-scripts";
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${playfair.variable} ${beVietnamPro.variable} h-full antialiased`}
    >
      <head>
        <Script src="/polyfills.js" strategy="beforeInteractive" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <PixelScripts
          fbPixelId={process.env.NEXT_PUBLIC_FB_PIXEL_ID}
          ttPixelId={process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID}
        />
        {children}
      </body>
    </html>
  );
}
