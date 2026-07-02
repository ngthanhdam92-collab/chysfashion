import { CartProvider } from "@/context/cart-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </CartProvider>
  );
}
