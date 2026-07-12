import { createPublicClient } from "./supabase/public";

export type MovementType =
  | "nhap_hang"      // Nhập hàng — tăng tồn
  | "xuat_hong"      // Xuất hỏng / thất lạc — giảm tồn
  | "doi_tra_nhap"   // Đổi trả còn dùng được — tăng tồn
  | "doi_tra_hong"   // Đổi trả hỏng — ghi nhận, không đổi tồn
  | "dieu_chinh";    // Điều chỉnh thủ công — delta ±

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  color: string;
  size: string;
  sku: string;
  type: MovementType;
  quantity: number; // signed: + tăng tồn, - giảm tồn, 0 chỉ ghi nhận
  note: string | null;
  createdAt: string;
}

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  nhap_hang:    "Nhập hàng",
  xuat_hong:    "Xuất hỏng",
  doi_tra_nhap: "Đổi trả (nhập kho)",
  doi_tra_hong: "Đổi trả (hỏng)",
  dieu_chinh:   "Điều chỉnh",
};

export const MOVEMENT_COLORS: Record<MovementType, string> = {
  nhap_hang:    "bg-emerald-100 text-emerald-700",
  xuat_hong:    "bg-red-100 text-red-700",
  doi_tra_nhap: "bg-blue-100 text-blue-700",
  doi_tra_hong: "bg-gray-100 text-gray-600",
  dieu_chinh:   "bg-amber-100 text-amber-700",
};

interface MovementRow {
  id: string;
  product_id: string;
  product_name: string;
  color: string;
  size: string;
  sku: string;
  type: MovementType;
  quantity: number;
  note: string | null;
  created_at: string;
}

function mapRow(row: MovementRow): StockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    color: row.color,
    size: row.size,
    sku: row.sku ?? "",
    type: row.type,
    quantity: row.quantity,
    note: row.note,
    createdAt: row.created_at,
  };
}

export async function getStockMovements(opts?: {
  type?: MovementType;
  from?: string;
  to?: string;
  limit?: number;
}): Promise<StockMovement[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from("stock_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 200);

  if (opts?.type) query = query.eq("type", opts.type);
  if (opts?.from) query = query.gte("created_at", opts.from);
  if (opts?.to)   query = query.lte("created_at", opts.to + "T23:59:59");

  const { data, error } = await query;
  if (error || !data) return [];
  return (data as MovementRow[]).map(mapRow);
}
