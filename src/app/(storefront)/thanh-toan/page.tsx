import { CheckoutView } from "@/components/checkout-view";
import { getBankSettings } from "@/lib/bank-settings";

export const metadata = { title: "Thanh toán — CHYS Fashion" };

export default async function CheckoutPage() {
  const bankSettings = await getBankSettings();
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-serif text-3xl text-ink sm:text-4xl">Thanh toán</h1>
      <div className="mt-10">
        <CheckoutView bankSettings={bankSettings} />
      </div>
    </div>
  );
}
