import { createPublicClient } from "./supabase/public";
interface SizeChartTemplateRow {
  id: string;
  name: string;
  data: Record<string, unknown> | null;
  created_at: string;
}

export interface SizeChartTemplate {
  id: string;
  name: string;
  data: Record<string, unknown>;
  createdAt: string;
}

function mapTemplateRow(row: SizeChartTemplateRow): SizeChartTemplate {
  return {
    id: row.id,
    name: row.name,
    data: (row.data ?? {}) as Record<string, Partial<SizeChartRow>>,
    createdAt: row.created_at,
  };
}

export async function getAllSizeChartTemplates(): Promise<SizeChartTemplate[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("size_charts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as SizeChartTemplateRow[]).map(mapTemplateRow);
}

export async function getSizeChartTemplateById(id: string): Promise<SizeChartTemplate | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("size_charts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapTemplateRow(data as SizeChartTemplateRow);
}
