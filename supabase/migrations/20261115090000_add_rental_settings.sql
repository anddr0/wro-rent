-- Settings of the rental the admin changes in the mini app: the hours when
-- a rental can start and the contact customers write to.
-- One rental — one row. `id` can only be true, so a second row is impossible.
create table public.rental_settings (
  id boolean primary key default true check (id),
  -- The first and the last start time of a day, in minutes from midnight
  -- (Warsaw time): 540 is 9:00, 1200 is 20:00.
  first_start_minute integer not null default 540
    check (first_start_minute between 0 and 1439),
  last_start_minute integer not null default 1200
    check (last_start_minute between 0 and 1439),
  -- True: a rental can start at any time of day. The two times above are
  -- kept, so switching it back off brings the old hours back.
  is_round_the_clock boolean not null default false,
  -- Telegram username customers write to, without "@". Null — not set yet.
  support_username text,
  updated_at timestamptz not null default now(),
  constraint rental_settings_hours_check check (first_start_minute <= last_start_minute)
);

insert into public.rental_settings default values;

create trigger rental_settings_set_updated_at before update on public.rental_settings
  for each row execute function public.set_updated_at();

-- Same as the other tables: only the server (secret key) reads and writes.
alter table public.rental_settings enable row level security;
