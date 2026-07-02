-- CHYS Fashion — thêm quản lý tồn kho
-- Chạy 1 lần trong Supabase SQL Editor.

-- 1. Thêm cột tồn kho; sản phẩm hiện có được đặt sẵn 100 để không bị "hết hàng" đột ngột.
alter table products
  add column if not exists stock integer not null default 0;

update products set stock = 100 where stock = 0;

-- 2. Tự động trừ tồn kho khi có đơn hàng mới.
-- security definer để trigger được phép cập nhật products dù khách đặt hàng là anon.
create or replace function decrement_stock_on_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
begin
  for item in select * from jsonb_array_elements(new.items)
  loop
    update products
      set stock = greatest(0, stock - coalesce((item->>'quantity')::int, 1))
      where id::text = item->>'productId';
  end loop;
  return new;
end;
$$;

drop trigger if exists orders_decrement_stock on orders;
create trigger orders_decrement_stock
  after insert on orders
  for each row execute function decrement_stock_on_order();
