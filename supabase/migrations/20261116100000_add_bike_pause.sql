-- "Temporarily unavailable" (pause): the bike stays in the catalog, but it
-- can't be booked until an admin switches the pause off. For a bike that is
-- out for an unknown time; for known dates there are bike_unavailable_periods,
-- and a bike that should vanish from the catalog is hidden (is_available).
alter table public.bikes add column is_paused boolean not null default false;
