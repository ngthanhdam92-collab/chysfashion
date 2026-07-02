-- CHYS Fashion — thêm bảng categories (chạy 1 lần trong Supabase SQL Editor)
-- Bảng products đã có sẵn từ schema.sql, không cần chạy lại schema.sql.

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  value text unique not null,
  label text not null,
  created_at timestamptz not null default now()
);

alter table categories enable row level security;

create policy "categories_public_read" on categories
  for select using (true);

create policy "categories_admin_write" on categories
  for insert to authenticated with check (true);

create policy "categories_admin_update" on categories
  for update to authenticated using (true);

create policy "categories_admin_delete" on categories
  for delete to authenticated using (true);

insert into categories (value, label) values
  ('ao-so-mi', 'Áo sơ mi'),
  ('ao-thun', 'Áo thun'),
  ('quan', 'Quần'),
  ('ao-khoac', 'Áo khoác'),
  ('dam-vay', 'Đầm & Váy'),
  ('phu-kien', 'Phụ kiện')
on conflict (value) do nothing;
