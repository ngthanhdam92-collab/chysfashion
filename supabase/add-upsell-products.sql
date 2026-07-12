-- CHYS Fashion — thêm cột upsell (Mua kèm thường thấy)
-- Chạy 1 lần trong Supabase SQL Editor.

alter table products
  add column if not exists upsell_product_ids text[] not null default '{}';
