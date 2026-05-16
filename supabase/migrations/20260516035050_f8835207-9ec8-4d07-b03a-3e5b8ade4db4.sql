
-- Site content singleton table
create table public.site_content (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

-- Public read so the landing page can fetch content anonymously
create policy "Site content is readable by anyone"
  on public.site_content
  for select
  using (true);

-- No insert/update/delete policies: writes go through the service role (server functions)

-- Storage bucket for site media (images/videos used on the landing page)
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- Public read on the bucket
create policy "Site media is publicly readable"
  on storage.objects
  for select
  using (bucket_id = 'site-media');

-- Writes only through service role (server functions); no insert/update/delete policies for anon/authenticated
