-- CHYS Fashion — thêm phân loại hàng (variants) và video sản phẩm
-- Chạy 1 lần trong Supabase SQL Editor.
-- Lưu ý: có cảnh báo "destructive operations" do lệnh drop trigger — an toàn, chỉ thay
-- phiên bản cũ của cơ chế trừ kho bằng bản mới, không xóa dữ liệu.

alter table products
  add column if not exists variants jsonb not null default '[]';

alter table products
  add column if not exists video_url text;

-- Trừ kho theo từng phân loại (màu + size); vẫn trừ tổng tồn kho như trước.
create or replace function decrement_stock_on_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  prod record;
  v jsonb;
  new_variants jsonb;
  qty int;
begin
  for item in select * from jsonb_array_elements(new.items)
  loop
    qty := coalesce((item->>'quantity')::int, 1);

    select id, variants into prod
    from products
    where id::text = item->>'productId';

    if not found then
      continue;
    end if;

    if jsonb_array_length(coalesce(prod.variants, '[]'::jsonb)) > 0 then
      new_variants := '[]'::jsonb;
      for v in select * from jsonb_array_elements(prod.variants)
      loop
        if v->>'color' = item->>'color' and v->>'size' = item->>'size' then
          v := jsonb_set(
            v,
            '{stock}',
            to_jsonb(greatest(0, coalesce((v->>'stock')::int, 0) - qty))
          );
        end if;
        new_variants := new_variants || jsonb_build_array(v);
      end loop;

      update products
        set variants = new_variants,
            stock = greatest(0, stock - qty)
        where id = prod.id;
    else
      update products
        set stock = greatest(0, stock - qty)
        where id = prod.id;
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists orders_decrement_stock on orders;
create trigger orders_decrement_stock
  after insert on orders
  for each row execute function decrement_stock_on_order();
