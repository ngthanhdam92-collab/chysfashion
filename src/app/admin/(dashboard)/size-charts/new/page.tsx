import { SizeChartForm } from "@/components/admin/size-chart-form";
import { createSizeChartTemplate } from "@/lib/size-chart-actions";

export default function NewSizeChartPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Tạo bảng size</h1>
      <div className="max-w-3xl border border-line bg-surface p-6">
        <SizeChartForm action={createSizeChartTemplate} />
      </div>
    </div>
  );
}
