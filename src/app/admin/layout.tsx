import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quản lý — CHYS Fashion",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-full bg-cream/40">{children}</div>;
}
