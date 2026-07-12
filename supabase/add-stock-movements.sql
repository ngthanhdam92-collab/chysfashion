-- CHYS Fashion — bảng lịch sử xuất nhập kho
-- Chạy 1 lần trong Supabase SQL Editor.

create table if not exists stock_movements (
  id          uuid        primary key default gen_random_uuid(),
  product_id  text        not null,
  product_name text       not null,
  color       text        not null default '',
  size        text        not null default '',
  -- loại phiếu: nhap_hang | xuat_hong | doi_tra_nhap | doi_tra_hong | dieu_chinh
  type        text        not null,
  -- delta kho: dương = tăng, âm = giảm, 0 = chỉ ghi nhận (doi_tra_hong)
  quantity    integer     not null default 0,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists stock_movements_product_id_idx on stock_movements(product_id);
create index if not exists stock_movements_created_at_idx on stock_movements(created_at desc);
