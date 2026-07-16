-- Add sort_order column to products table
-- Run this in Supabase Dashboard > SQL Editor

ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Initialize existing products with sequential sort_order preserving current created_at DESC order
-- (newest product gets sort_order = 1, second newest = 2, etc.)
UPDATE products p
SET sort_order = sub.rn
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
  FROM products
) sub
WHERE p.id = sub.id;

-- Optional: create an index for faster ordering
CREATE INDEX IF NOT EXISTS products_sort_order_idx ON products (sort_order ASC);
