-- Zugangscode-System entfernt — KI-Zugang läuft jetzt nur noch direkt per E-Mail
-- (set_ai_access/set_ai_access_by_id, siehe 0020_ai_access_admin.sql).
drop table if exists public.access_codes;
