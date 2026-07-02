-- CHYS Fashion — Supabase schema
-- Chạy toàn bộ file này 1 lần trong Supabase SQL Editor (Project > SQL Editor > New query > Run)

-- ============ EXTENSIONS ============
create extension if not exists "pgcrypto";

-- ============ TABLE: products ============
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  category_label text not null,
  gender text not null check (gender in ('nam', 'nu', 'unisex')),
  price numeric not null,
  compare_at_price numeric,
  colors jsonb not null default '[]',
  sizes jsonb not null default '[]',
  description text not null default '',
  details jsonb not null default '[]',
  is_new boolean not null default false,
  is_bestseller boolean not null default false,
  rating numeric not null default 5,
  review_count integer not null default 0,
  images jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table products enable row level security;

create policy "products_public_read" on products
  for select using (true);

create policy "products_admin_write" on products
  for insert to authenticated with check (true);

create policy "products_admin_update" on products
  for update to authenticated using (true);

create policy "products_admin_delete" on products
  for delete to authenticated using (true);

-- ============ TABLE: orders ============
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_code text unique not null,
  full_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  note text,
  items jsonb not null default '[]',
  subtotal numeric not null,
  shipping numeric not null default 0,
  total numeric not null,
  status text not null default 'moi' check (status in ('moi', 'dang_xu_ly', 'da_giao', 'da_huy')),
  created_at timestamptz not null default now()
);

alter table orders enable row level security;

create policy "orders_public_insert" on orders
  for insert to anon, authenticated with check (true);

create policy "orders_admin_read" on orders
  for select to authenticated using (true);

create policy "orders_admin_update" on orders
  for update to authenticated using (true);

-- ============ TABLE: categories ============
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

-- ============ TABLE: nav_links ============
create table if not exists nav_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  position integer not null default 0,
  parent_id uuid references nav_links(id) on delete cascade,
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

-- ============ STORAGE: product-media bucket ============
insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;

create policy "product_media_public_read" on storage.objects
  for select using (bucket_id = 'product-media');

create policy "product_media_admin_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-media');

create policy "product_media_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'product-media');

create policy "product_media_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-media');

-- ============ SEED DATA: 12 sản phẩm mẫu ============
insert into products (slug, name, category, category_label, gender, price, compare_at_price, colors, sizes, description, details, is_new, is_bestseller, rating, review_count, images)
values
(
  'ao-so-mi-lanh-cao-cap', 'Áo Sơ Mi Lanh Cao Cấp', 'ao-so-mi', 'Áo sơ mi', 'nam', 890000, 1190000,
  '[{"name":"Đen","hex":"#171310"},{"name":"Kem","hex":"#f1ebe0"},{"name":"Be","hex":"#c9b79c"}]',
  '["S","M","L","XL"]',
  'Áo sơ mi dệt từ vải lanh nguyên chất, form regular fit tôn dáng, phù hợp cho môi trường công sở lẫn dạo phố. Đường may tỉ mỉ, chất liệu thoáng khí quanh năm.',
  '["Chất liệu: 100% Linen nhập khẩu","Form dáng: Regular fit","Hướng dẫn giặt: Giặt tay hoặc giặt máy chế độ nhẹ, ủi nhiệt độ thấp","Xuất xứ: Sản xuất tại Việt Nam"]',
  true, true, 4.8, 214, '[]'
),
(
  'ao-thun-cotton-form-rong', 'Áo Thun Cotton Form Rộng', 'ao-thun', 'Áo thun', 'unisex', 450000, null,
  '[{"name":"Nâu rêu","hex":"#5c5340"},{"name":"Xám tro","hex":"#8a8479"},{"name":"Trắng ngà","hex":"#f4efe4"}]',
  '["S","M","L","XL"]',
  'Áo thun basic form rộng, chất cotton compact cao cấp không xù lông, giữ form dáng bền đẹp sau nhiều lần giặt.',
  '["Chất liệu: Cotton Compact 240gsm","Form dáng: Oversized","Hướng dẫn giặt: Giặt máy dưới 30 độ","Xuất xứ: Sản xuất tại Việt Nam"]',
  false, true, 4.7, 356, '[]'
),
(
  'quan-tay-au-slimfit', 'Quần Tây Âu Slim Fit', 'quan', 'Quần', 'nam', 990000, null,
  '[{"name":"Đen","hex":"#171310"},{"name":"Kem","hex":"#f1ebe0"},{"name":"Be","hex":"#c9b79c"}]',
  '["S","M","L","XL"]',
  'Quần tây dáng slim fit, vải wool blend co giãn nhẹ, đứng phom trong suốt ngày dài di chuyển.',
  '["Chất liệu: Wool blend 4-way stretch","Form dáng: Slim fit","Hướng dẫn giặt: Giặt khô được khuyến nghị","Xuất xứ: Sản xuất tại Việt Nam"]',
  false, false, 4.6, 128, '[]'
),
(
  'ao-khoac-blazer-len', 'Áo Khoác Blazer Dạ Len', 'ao-khoac', 'Áo khoác', 'nam', 2190000, 2590000,
  '[{"name":"Xanh rêu","hex":"#3f5e3f"},{"name":"Rượu vang","hex":"#6d2f34"},{"name":"Đen","hex":"#171310"}]',
  '["S","M","L","XL"]',
  'Blazer dạ len cao cấp, thiết kế tối giản sang trọng, lớp lót lụa mềm mại, phù hợp cho các dịp quan trọng.',
  '["Chất liệu: Dạ len 70% Wool","Form dáng: Tailored fit","Hướng dẫn giặt: Giặt khô","Xuất xứ: Sản xuất tại Việt Nam"]',
  true, false, 4.9, 87, '[]'
),
(
  'dam-lua-midi-thanh-lich', 'Đầm Lụa Midi Thanh Lịch', 'dam-vay', 'Đầm & Váy', 'nu', 1590000, null,
  '[{"name":"Xanh rêu","hex":"#3f5e3f"},{"name":"Rượu vang","hex":"#6d2f34"},{"name":"Đen","hex":"#171310"}]',
  '["S","M","L","XL"]',
  'Đầm midi chất liệu lụa satin, form ôm nhẹ tôn đường cong, thích hợp cho tiệc tối hoặc sự kiện quan trọng.',
  '["Chất liệu: Lụa satin cao cấp","Form dáng: Ôm nhẹ (bodycon)","Hướng dẫn giặt: Giặt khô hoặc giặt tay nhẹ nhàng","Xuất xứ: Sản xuất tại Việt Nam"]',
  true, true, 4.9, 163, '[]'
),
(
  'vay-chu-a-linen', 'Váy Chữ A Vải Linen', 'dam-vay', 'Đầm & Váy', 'nu', 750000, null,
  '[{"name":"Đen","hex":"#171310"},{"name":"Kem","hex":"#f1ebe0"},{"name":"Be","hex":"#c9b79c"}]',
  '["S","M","L","XL"]',
  'Váy chữ A phom dáng nhẹ nhàng, chất liệu linen thoáng mát, dễ phối cùng áo sơ mi hoặc áo thun basic.',
  '["Chất liệu: 100% Linen","Form dáng: Chữ A","Hướng dẫn giặt: Giặt máy chế độ nhẹ","Xuất xứ: Sản xuất tại Việt Nam"]',
  false, false, 4.5, 98, '[]'
),
(
  'ao-so-mi-lua-nu', 'Áo Sơ Mi Lụa Cổ Điển', 'ao-so-mi', 'Áo sơ mi', 'nu', 950000, null,
  '[{"name":"Nâu rêu","hex":"#5c5340"},{"name":"Xám tro","hex":"#8a8479"},{"name":"Trắng ngà","hex":"#f4efe4"}]',
  '["S","M","L","XL"]',
  'Áo sơ mi nữ chất liệu lụa mềm mại, thiết kế cổ điển tinh tế, dễ dàng phối cùng chân váy hoặc quần tây.',
  '["Chất liệu: Lụa pha 95%","Form dáng: Regular fit","Hướng dẫn giặt: Giặt tay, không vắt mạnh","Xuất xứ: Sản xuất tại Việt Nam"]',
  false, true, 4.7, 176, '[]'
),
(
  'ao-khoac-trench-coat', 'Áo Khoác Trench Coat Dáng Dài', 'ao-khoac', 'Áo khoác', 'nu', 2450000, null,
  '[{"name":"Đen","hex":"#171310"},{"name":"Kem","hex":"#f1ebe0"},{"name":"Be","hex":"#c9b79c"}]',
  '["S","M","L","XL"]',
  'Trench coat kinh điển, chất liệu cotton gabardine chống nhăn, thắt eo tôn dáng, item không thể thiếu mỗi mùa thu đông.',
  '["Chất liệu: Cotton gabardine","Form dáng: Dáng dài, thắt eo","Hướng dẫn giặt: Giặt khô","Xuất xứ: Sản xuất tại Việt Nam"]',
  true, false, 4.8, 64, '[]'
),
(
  'quan-jogger-cotton', 'Quần Jogger Cotton Thoải Mái', 'quan', 'Quần', 'unisex', 590000, null,
  '[{"name":"Nâu rêu","hex":"#5c5340"},{"name":"Xám tro","hex":"#8a8479"},{"name":"Trắng ngà","hex":"#f4efe4"}]',
  '["S","M","L","XL"]',
  'Quần jogger phom suông thoải mái, chất cotton fleece giữ ấm nhẹ, phù hợp mặc hằng ngày hoặc tập luyện.',
  '["Chất liệu: Cotton fleece","Form dáng: Regular fit, bo gấu","Hướng dẫn giặt: Giặt máy dưới 30 độ","Xuất xứ: Sản xuất tại Việt Nam"]',
  false, false, 4.6, 142, '[]'
),
(
  'that-lung-da-that', 'Thắt Lưng Da Thật Khóa Vàng', 'phu-kien', 'Phụ kiện', 'unisex', 690000, null,
  '[{"name":"Nâu bò","hex":"#5c4224"},{"name":"Đen","hex":"#171310"}]',
  '["Freesize"]',
  'Thắt lưng da bò thật cao cấp, khóa mạ vàng sang trọng, hoàn thiện tổng thể trang phục công sở hoặc dạo phố.',
  '["Chất liệu: Da bò thật","Khóa: Hợp kim mạ vàng 18k","Bảo hành: 12 tháng lỗi khóa","Xuất xứ: Sản xuất tại Việt Nam"]',
  false, true, 4.9, 201, '[]'
),
(
  'khan-lua-hoa-tiet', 'Khăn Lụa Họa Tiết Vintage', 'phu-kien', 'Phụ kiện', 'nu', 390000, null,
  '[{"name":"Xanh rêu","hex":"#3f5e3f"},{"name":"Rượu vang","hex":"#6d2f34"},{"name":"Đen","hex":"#171310"}]',
  '["Freesize"]',
  'Khăn lụa họa tiết độc quyền CHYS, có thể quàng cổ, buộc tóc hoặc phối cùng túi xách để tăng điểm nhấn.',
  '["Chất liệu: Lụa 100%","Kích thước: 90x90cm","Hướng dẫn giặt: Giặt tay nhẹ nhàng","Xuất xứ: Sản xuất tại Việt Nam"]',
  true, false, 4.7, 58, '[]'
),
(
  'ao-thun-polo-pique', 'Áo Polo Pique Cao Cấp', 'ao-thun', 'Áo thun', 'nam', 590000, null,
  '[{"name":"Đen","hex":"#171310"},{"name":"Kem","hex":"#f1ebe0"},{"name":"Be","hex":"#c9b79c"}]',
  '["S","M","L","XL"]',
  'Áo polo dệt kim pique, cổ bo chắc chắn không bai giãn, phù hợp phong cách smart-casual mỗi ngày.',
  '["Chất liệu: Cotton Pique 220gsm","Form dáng: Regular fit","Hướng dẫn giặt: Giặt máy chế độ nhẹ","Xuất xứ: Sản xuất tại Việt Nam"]',
  false, false, 4.6, 189, '[]'
)
on conflict (slug) do nothing;
