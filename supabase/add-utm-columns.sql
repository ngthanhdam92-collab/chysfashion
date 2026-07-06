-- CHYS Fashion — thêm cột UTM vào analytics_events
-- Chạy 1 lần trong Supabase SQL Editor.

alter table analytics_events
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text;

create index if not exists analytics_events_utm_source on analytics_events (utm_source);
