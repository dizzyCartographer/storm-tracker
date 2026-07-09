-- Mirrors the GRANTs applied manually to production on 2026-04-08 (ST-004 —
-- not yet in a migration; M1-9 turns these into the first dbmate migration).
-- Applied AFTER migrations so all tables exist. RLS still filters every row:
-- these grants only give the roles base table privileges, as on Neon.

GRANT USAGE ON SCHEMA public TO authenticated, anonymous;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
