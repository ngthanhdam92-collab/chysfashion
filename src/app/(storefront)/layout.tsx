import { CartProvider } from "@/context/cart-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getNavLinks } from "@/lib/nav-links";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navLinks = await getNavLinks();

  return (
    <CartProvider>
      <Header navLinks={navLinks} />
      <main className="flex-1">{children}</main>
      <Footer />
    </CartProvider>
  );
}
