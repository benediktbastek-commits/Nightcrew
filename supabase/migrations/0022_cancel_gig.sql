-- Erlaubt, einen Gig abzusagen statt ihn zu löschen (Löschen würde an Foreign Keys
-- von itinerary_stops/invoices scheitern und Historie unnötig verlieren).
alter table public.gigs drop constraint if exists gigs_status_check;
alter table public.gigs add constraint gigs_status_check check (status in ('confirmed', 'requested', 'option', 'cancelled'));
