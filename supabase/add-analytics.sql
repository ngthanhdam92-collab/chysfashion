-- CHYS Fashion — bảng theo dõi lượng truy cập
-- Chạy 1 lần trong Supabase SQL Editor.

create table if not exists analytics_events (
  id         uuid        default gen_random_uuid() primary key,
  event_type text        not null,          -- 'page_view' | 'add_to_cart'
  session_id text        not null,
  page_path  text,
  referrer   text,
  product_id text,
  created_at timestamptz default now()
);

create index if not exists analytics_events_created_at on analytics_events (created_at desc);
create index if not exists analytics_events_session    on analytics_events (session_id);
create index if not exists analytics_events_type       on analytics_events (event_type);

-- RLS: anon có thể insert (tracking từ browser qua API route)
--      authenticated (admin) có thể đọc
alter table analytics_events enable row level security;

drop policy if exists "anon_insert"  on analytics_events;
drop policy if exists "auth_select"  on analytics_events;

create policy "anon_insert" on analytics_events
  for insert to anon with check (true);

create policy "auth_select" on analytics_events
  for select to authenticated using (true);
