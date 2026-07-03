import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { getAllSizeChartTemplates } from "@/lib/size-chart-templates";
import { DeleteSizeChartButton } from "@/components/admin/delete-size-chart-button";

export default async function SizeChartsPage() {
  const templates = await getAllSizeChartTemplates();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Bảng size</h1>
          <p className="mt-0.5 text-sm text-muted">
            Tạo nhiều bảng thông số size — gán cho từng sản phẩm khi đăng bán
          </p>
        </div>
        <Link
          href="/admin/size-charts/new"
          className="flex items-center gap-2 bg-ink px-5 py-2.5 text-[12px] tracking-label uppercase text-paper hover:bg-ink/85"
        >
          <Plus size={15} /> Tạo bảng size
        </Link>
      </div>

      <div className="mt-8">
        {templates.length === 0 ? (
          <div className="rounded border border-dashed border-line px-6 py-16 text-center">
            <p className="text-muted">Chưa có bảng size nào.</p>
            <Link
              href="/admin/size-charts/new"
              className="mt-3 inline-block text-sm text-blue-600 hover:underline"
            >
              Tạo bảng size đầu tiên
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-line border border-line bg-white">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink">{t.name}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {Object.keys(t.data).length > 0
                      ? Object.keys(t.data).join(" · ")
                      : "Chưa có size"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/admin/size-charts/${t.id}/edit`}
                    className="flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs text-ink hover:border-gold hover:text-gold-dark"
                  >
                    <Pencil size={12} /> Chỉnh sửa
                  </Link>
                  <DeleteSizeChartButton id={t.id} name={t.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
