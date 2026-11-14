-- Bookings before the first request can be sent (slice 2.1).

-- 1. An admin can refuse a request: status `rejected` (А-7).
alter type public.booking_status add value 'rejected';

-- 2. A request that waits for an answer doesn't hold the dates any more:
-- only confirmed and active bookings of one bike can't overlap (К-3).
alter table public.bookings drop constraint bookings_no_overlap;
alter table public.bookings add constraint bookings_no_overlap exclude using gist (
  bike_id with =,
  tstzrange(starts_at, ends_at) with &&
) where (status in ('confirmed', 'active'));

-- 3. A plan's duration becomes "3 days" as a number and a unit instead of
-- an interval. The mini app has to add it to the start time itself (to show
-- the end and the busy times), and an interval comes from the API as text
-- like "1 mon 3 days 02:00:00" that would need parsing.
create type public.duration_unit as enum ('hour', 'day', 'week', 'month');

alter table public.rental_plans
  add column duration_count integer check (duration_count > 0),
  add column duration_unit public.duration_unit;

-- Existing plans are whole months, weeks, days or hours. A mixed interval
-- ("1 day 2 hours") would become hours, rounded up.
update public.rental_plans set
  duration_unit = case
    when extract(year from duration) * 12 + extract(month from duration) > 0 then 'month'
    when extract(day from duration) > 0 and extract(hour from duration) = 0
      and extract(day from duration)::integer % 7 = 0 then 'week'
    when extract(day from duration) > 0 and extract(hour from duration) = 0 then 'day'
    else 'hour'
  end::public.duration_unit,
  duration_count = case
    when extract(year from duration) * 12 + extract(month from duration) > 0
      then extract(year from duration) * 12 + extract(month from duration)
    when extract(day from duration) > 0 and extract(hour from duration) = 0
      and extract(day from duration)::integer % 7 = 0 then extract(day from duration) / 7
    when extract(day from duration) > 0 and extract(hour from duration) = 0
      then extract(day from duration)
    else greatest(1, ceil(extract(epoch from duration) / 3600))
  end;

alter table public.rental_plans
  alter column duration_count set not null,
  alter column duration_unit set not null,
  drop column duration;

-- The customer's bookings are listed on the home page, the bike's — for its calendar.
create index bookings_bike_id_starts_at_idx on public.bookings (bike_id, starts_at);
