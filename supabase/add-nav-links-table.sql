-- CHYS Fashion — thêm bảng nav_links (menu điều hướng đầu trang)
-- Chạy 1 lần trong Supabase SQL Editor.

create table if not exists nav_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table nav_links enable row level security;

create policy "nav_links_public_read" on nav_links
  for select using (true);

create policy "nav_links_admin_write" on nav_links
  for insert to authenticated with check (true);

create policy "nav_links_admin_update" on nav_links
  for update to authenticated using (true);

create policy "nav_links_admin_delete" on nav_links
  for delete to authenticated using (true);

insert into nav_links (label, href, position) values
  ('Nam', '/san-pham?gender=nam', 1),
  ('Nữ', '/san-pham?gender=nu', 2),
  ('Bộ sưu tập mới', '/san-pham?filter=moi', 3),
  ('Sale', '/san-pham?filter=sale', 4),
  ('Về chúng tôi', '/ve-chung-toi', 5)
on conflict do nothing;
