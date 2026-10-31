-- Initial schema: users, bikes, rental plans with per-bike price overrides, bookings.
-- Prices are in PLN. All access goes through the server (service role); RLS is
-- enabled without policies, so anon/authenticated clients can't touch the tables.

create extension if not exists btree_gist with schema extensions;

create type public.user_role as enum ('customer', 'admin');
create type public.booking_status as enum ('pending', 'confirmed', 'active', 'completed', 'cancelled');
create type public.payment_method as enum ('cash', 'card', 'blik');

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- users: Telegram users (customers and admins)

create table public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  full_name text not null,
  username text,
  language_code text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- bikes: is_available = false hides a bike from booking (repair, sold, ...);
-- whether it's rented is derived from bookings, not stored here.

create table public.bikes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  photo_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- rental_plans: standard rentals with a default price for every bike.
-- Deactivate plans instead of deleting them: bookings reference them.

create table public.rental_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration interval not null check (duration > interval '0'),
  price numeric(10, 2) not null check (price >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- bike_price_overrides: custom price of a plan for a specific bike.

create table public.bike_price_overrides (
  bike_id uuid not null references public.bikes (id) on delete cascade,
  plan_id uuid not null references public.rental_plans (id) on delete cascade,
  price numeric(10, 2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (bike_id, plan_id)
);

-- bike_plan_prices: effective price of every active plan for every bike.

create view public.bike_plan_prices with (security_invoker = true) as
select
  b.id as bike_id,
  p.id as plan_id,
  p.name as plan_name,
  p.duration,
  p.sort_order,
  coalesce(o.price, p.price) as price,
  o.price is not null as is_override
from public.bikes b
cross join public.rental_plans p
left join public.bike_price_overrides o on o.bike_id = b.id and o.plan_id = p.id
where p.is_active;

-- bookings: plan_id is null for individually agreed rentals (e.g. hourly).
-- price is fixed at booking time so later plan changes don't affect it.

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete restrict,
  bike_id uuid not null references public.bikes (id) on delete restrict,
  plan_id uuid references public.rental_plans (id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.booking_status not null default 'pending',
  price numeric(10, 2) not null check (price >= 0),
  deposit numeric(10, 2) check (deposit >= 0),
  payment_method public.payment_method,
  paid_at timestamptz,
  picked_up_at timestamptz,
  returned_at timestamptz,
  comment text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_period_check check (ends_at > starts_at),
  -- A bike can't have two live bookings with overlapping periods.
  constraint bookings_no_overlap exclude using gist (
    bike_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending', 'confirmed', 'active'))
);

create index bookings_user_id_idx on public.bookings (user_id);
create index bookings_plan_id_idx on public.bookings (plan_id);
create index bike_price_overrides_plan_id_idx on public.bike_price_overrides (plan_id);

create trigger users_set_updated_at before update on public.users
  for each row execute function public.set_updated_at();
create trigger bikes_set_updated_at before update on public.bikes
  for each row execute function public.set_updated_at();
create trigger rental_plans_set_updated_at before update on public.rental_plans
  for each row execute function public.set_updated_at();
create trigger bike_price_overrides_set_updated_at before update on public.bike_price_overrides
  for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.bikes enable row level security;
alter table public.rental_plans enable row level security;
alter table public.bike_price_overrides enable row level security;
alter table public.bookings enable row level security;
