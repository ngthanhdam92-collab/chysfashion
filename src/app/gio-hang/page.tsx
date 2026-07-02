import { CartView } from "@/components/cart-view";

export const metadata = { title: "Giỏ hàng — CHYS Fashion" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl text-ink sm:text-4xl">Giỏ hàng</h1>
      <div className="mt-10">
        <CartView />
      </div>
    </div>
  );
}
