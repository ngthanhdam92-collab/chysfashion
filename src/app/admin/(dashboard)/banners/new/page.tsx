import { BannerForm } from "@/components/admin/banner-form";
import { createBanner } from "@/lib/banners-actions";

export default function NewBannerPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Thêm banner</h1>
      <div className="max-w-3xl border border-line bg-surface p-6">
        <BannerForm action={createBanner} />
      </div>
    </div>
  );
}
