-- Times when a bike can't be rented although nobody booked it: it is being
-- repaired, lent to a friend and so on. An admin adds them by hand on the
-- bike's page. For customers such a time looks like any other busy time.
create table public.bike_unavailable_periods (
  id uuid primary key default gen_random_uuid(),
  bike_id uuid not null references public.bikes (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint bike_unavailable_periods_check check (ends_at > starts_at)
);

create index bike_unavailable_periods_bike_id_idx
  on public.bike_unavailable_periods (bike_id, ends_at);

-- Same as the other tables: only the server (secret key) reads and writes.
alter table public.bike_unavailable_periods enable row level security;
