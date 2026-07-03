import { notFound } from "next/navigation";
import { getSizeChartTemplateById } from "@/lib/size-chart-templates";
import { updateSizeChartTemplate } from "@/lib/size-chart-actions";
import { SizeChartForm } from "@/components/admin/size-chart-form";

interface Params {
  params: Promise<{ id: string }>;
}

export default async function EditSizeChartPage({ params }: Params) {
  const { id } = await params;
  const template = await getSizeChartTemplateById(id);
  if (!template) notFound();

  const updateWithId = updateSizeChartTemplate.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl text-ink">Chỉnh sửa bảng size</h1>
      <div className="max-w-3xl border border-line bg-surface p-6">
        <SizeChartForm template={template} action={updateWithId} />
      </div>
    </div>
  );
}
