-- CHYS Fashion — thêm giá vốn để tính lợi nhuận
-- Chạy 1 lần trong Supabase SQL Editor.

-- Thêm cột giá vốn vào bảng products (dùng cho sản phẩm không có phân loại).
-- Sản phẩm có phân loại (variants) lưu costPrice trong mảng JSONB variants.
alter table products
  add column if not exists cost_price integer;
