-- Thêm cột sku vào stock_movements (chạy sau add-stock-movements.sql)
alter table stock_movements
  add column if not exists sku text not null default '';
