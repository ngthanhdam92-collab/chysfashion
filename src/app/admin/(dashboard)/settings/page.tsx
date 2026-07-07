import { getBankSettings } from "@/lib/bank-settings";
import { BankSettingsClient } from "@/components/admin/bank-settings-client";

export const metadata = { title: "Cài đặt — Admin CHYS" };

export default async function SettingsPage() {
  const settings = await getBankSettings();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Cài đặt thanh toán</h1>
        <p className="mt-1 text-sm text-muted">
          Cấu hình tài khoản ngân hàng nhận chuyển khoản từ khách hàng.
        </p>
      </div>
      <BankSettingsClient initial={settings} />
    </div>
  );
}
