import { getPixelSettings } from "@/lib/pixel-settings";
import { PixelSettingsClient } from "@/components/admin/pixel-settings-client";

export const metadata = { title: "Tracking Pixel — Admin CHYS" };

export default async function PixelPage() {
  const settings = await getPixelSettings();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Tracking Pixel</h1>
        <p className="mt-1 text-sm text-muted">
          Cấu hình Facebook Pixel và TikTok Pixel để đo hiệu quả quảng cáo.
          Để trống nếu chưa dùng.
        </p>
      </div>
      <PixelSettingsClient initial={settings} />
    </div>
  );
}
