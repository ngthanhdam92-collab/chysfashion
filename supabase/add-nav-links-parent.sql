-- CHYS Fashion — thêm menu con (dropdown) cho nav_links
-- Chạy 1 lần trong Supabase SQL Editor. Bảng nav_links đã có sẵn từ trước.

alter table nav_links
  add column if not exists parent_id uuid references nav_links(id) on delete cascade;
