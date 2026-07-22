import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil } from "lucide-react";
import { getAllBanners } from "@/lib/banners";
import { DeleteBannerButton } from "@/components/admin/delete-banner-button";

export default async function BannersPage() {
  const banners = await getAllBanners();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Banner trang chủ</h1>
          <p className="mt-0.5 text-sm text-muted">
            Quản lý ảnh banner hiển thị ở đầu trang chủ — sắp xếp theo vị trí
          </p>
        </div>
        <Link
          href="/admin/banners/new"
          className="flex items-center gap-2 bg-ink px-5 py-2.5 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85"
        >
          <Plus size={15} /> Thêm banner
        </Link>
      </div>

      <div className="mt-8">
        {banners.length === 0 ? (
          <div className="rounded border border-dashed border-line px-6 py-16 text-center">
            <p className="text-muted">Chưa có banner nào.</p>
            <Link
              href="/admin/banners/new"
              className="mt-3 inline-block text-sm text-blue-600 hover:underline"
            >
              Tạo banner đầu tiên
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-line border border-line bg-white">
            {banners.map((b) => (
              <div key={b.id} className="flex items-center gap-4 px-5 py-4">
                {/* Thumbnail */}
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded bg-cream">
                  {b.imageUrl ? (
                    <Image src={b.imageUrl} alt={b.title} fill unoptimized className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[10px] text-stone">
                      Chưa có ảnh
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{b.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        b.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-line text-stone"
                      }`}
                    >
                      {b.isActive ? "Hiển thị" : "Ẩn"}
                    </span>
                  </div>
                  {b.subtitle && (
                    <p className="mt-0.5 truncate text-xs text-muted">{b.subtitle}</p>
                  )}
                  <p className="mt-0.5 text-xs text-stone">
                    Vị trí: {b.position} · Nút: {b.linkLabel} → {b.linkUrl}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/admin/banners/${b.id}/edit`}
                    className="flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs text-ink hover:border-gold hover:text-gold-dark"
                  >
                    <Pencil size={12} /> Chỉnh sửa
                  </Link>
                  <DeleteBannerButton id={b.id} title={b.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-stone">
        Banner có <strong>Vị trí</strong> nhỏ hơn sẽ hiển thị trước. Chỉ banner đang <strong>Hiển thị</strong> mới xuất hiện ngoài trang chủ.
      </p>
    </div>
  );
}
