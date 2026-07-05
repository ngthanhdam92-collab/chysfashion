import { CartProvider } from "@/context/cart-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getNavLinks } from "@/lib/nav-links";
import { getHomepageSettings } from "@/lib/homepage-settings";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [navLinks, settings] = await Promise.all([
    getNavLinks(),
    getHomepageSettings(),
  ]);

  return (
    <CartProvider>
      <Header navLinks={navLinks} announcement={settings.announcementBar} />
      <main className="flex-1">{children}</main>
      <Footer />
    </CartProvider>
  );
}
