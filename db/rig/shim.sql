-- Test-rig shim (build-spec §5.1). Applied to the throwaway test database BEFORE
-- the migrations. Replaces Neon-only infrastructure:
--
-- 1. `auth.user_id()` — provided by the pg_session_jwt extension on Neon (reads the
--    JWT `sub` claim). Here it reads the `test.user_id` GUC so tests can impersonate
--    any user: SET LOCAL test.user_id = '<uuid>'.
-- 2. Data API roles — created manually on Neon (ST-004). `authenticated` is what
--    PostgREST uses for JWT-bearing requests; RLS tests SET ROLE to it.
--
-- ⚠️ Test-only. Never apply to a real environment.

CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.user_id() RETURNS text
LANGUAGE sql STABLE
AS $$ SELECT nullif(current_setting('test.user_id', true), '') $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anonymous') THEN
    CREATE ROLE anonymous NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
    CREATE ROLE authenticator NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'neon_auth') THEN
    CREATE ROLE neon_auth NOLOGIN;
  END IF;
END $$;

GRANT USAGE ON SCHEMA auth TO authenticated, anonymous;
