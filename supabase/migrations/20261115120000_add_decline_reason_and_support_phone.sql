-- Why the admin rejected a request or cancelled a booking, in their own
-- words. Optional; the customer sees it in the bot's message and in the
-- booking card. Null also for requests rejected automatically, when another
-- request for the same dates was confirmed.
alter table public.bookings add column decline_reason text;

-- A phone number customers can call, next to the Telegram contact.
-- Stored without spaces: "+48123456789". Null — not set.
alter table public.rental_settings add column support_phone text;
