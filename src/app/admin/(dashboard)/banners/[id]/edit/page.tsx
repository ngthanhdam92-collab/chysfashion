import { notFound } from "next/navigation";
import { getBannerById } from "@/lib/banners";
import { updateBanner } from "@/lib/banners-actions";
import { BannerForm } from "@/components/admin/banner-form";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function EditBannerPage({ params }: Params) {
  const { id } = await params;
  const banner = await getBannerById(id);
  if (!banner) notFound();

  const updateWithId = updateBanner.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Sửa banner</h1>
      <div className="max-w-3xl border border-line bg-surface p-6">
        <BannerForm banner={banner} action={updateWithId} />
      </div>
    </div>
  );
}
