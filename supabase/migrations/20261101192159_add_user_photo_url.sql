-- Telegram avatar URL, refreshed on every sign-in.
-- Null when the user hides their photo in Telegram privacy settings.

alter table public.users add column photo_url text;
