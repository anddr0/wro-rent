-- Bike photos (slice 1.3). The files live in the public Storage bucket
-- `bike-photos`; this table says which bike they belong to and in what order.
-- The first photo is the bike's cover in the catalog.

create table public.bike_photos (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.bikes (id) on delete cascade,
  -- Object path inside the bucket: "<bike id>/<file name>".
  path text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index bike_photos_bike_id_sort_order_idx on public.bike_photos (bike_id, sort_order);

-- Same as the other tables: only the server (secret key) reads and writes.
alter table public.bike_photos enable row level security;

-- Replaced by bike_photos: a bike has several photos, not one.
alter table public.bikes drop column photo_url;

-- Public: anyone with a link can view a photo, as on any shop page. Uploading
-- needs the secret key, since there are no storage policies for other roles.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bike-photos',
  'bike-photos',
  true,
  5242880, -- 5 MiB
  array['image/jpeg', 'image/png', 'image/webp']
);
