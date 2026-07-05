import type { Metadata } from "next";
import { Playfair_Display, Be_Vietnam_Pro } from "next/font/google";
import Script from "next/script";
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
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
