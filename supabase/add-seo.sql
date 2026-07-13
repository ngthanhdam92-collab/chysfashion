-- SEO settings per static page
create table if not exists page_seo (
  id           uuid default gen_random_uuid() primary key,
  page_key     text not null unique,
  meta_title   text,
  meta_description text,
  og_image     text,
  updated_at   timestamp with time zone default now()
);

alter table page_seo enable row level security;
create policy "allow_all_page_seo" on page_seo for all using (true) with check (true);

-- Per-product SEO override fields
alter table products
  add column if not exists meta_title       text,
  add column if not exists meta_description text;
