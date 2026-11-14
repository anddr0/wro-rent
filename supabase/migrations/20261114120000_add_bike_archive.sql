-- Archive (А-5): a bike that isn't rented out any more. Its bookings stay,
-- but neither customers nor the admin's main list show it.
-- Null — the bike is in use; a time — when it was archived.
alter table public.bikes add column archived_at timestamptz;
