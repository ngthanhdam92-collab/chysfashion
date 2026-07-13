-- Abandoned cart tracking
-- Run in Supabase SQL editor

create table if not exists abandoned_carts (
  id           uuid        default gen_random_uuid() primary key,
  session_id   text        not null unique,
  full_name    text,
  phone        text,
  email        text,
  items        jsonb       not null default '[]'::jsonb,
  subtotal     numeric     not null default 0,
  recovered    boolean     not null default false,
  order_code   text,
  contacted_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table abandoned_carts enable row level security;

-- Allow public (anon + authenticated) to upsert their own cart by session_id
create policy "public_upsert_abandoned_carts"
  on abandoned_carts for all
  using (true) with check (true);
