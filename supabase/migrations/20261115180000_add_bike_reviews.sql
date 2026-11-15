-- Reviews of bikes. A customer can leave one after a completed rental:
-- a rating from 1 to 5 and an optional comment. One booking — one review.
-- A new review is `pending` and nobody but admins sees it; an admin makes it
-- `approved` (shown on the bike's page) or `hidden`, and can change it later.
create type public.review_status as enum ('pending', 'approved', 'hidden');

create table public.bike_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  -- The bike and the author are also in the booking; they are repeated here
  -- so the reviews of a bike are found without joining bookings.
  bike_id uuid not null references public.bikes (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  status public.review_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bike_reviews_bike_id_status_idx on public.bike_reviews (bike_id, status);

create trigger bike_reviews_set_updated_at before update on public.bike_reviews
  for each row execute function public.set_updated_at();

-- Same as the other tables: only the server (secret key) reads and writes.
alter table public.bike_reviews enable row level security;
