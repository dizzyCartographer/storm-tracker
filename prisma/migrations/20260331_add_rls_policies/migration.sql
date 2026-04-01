-- ============================================================
-- Phase B: Row-Level Security Policies for Neon Data API
-- ============================================================
-- RLS only affects the Neon Data API (authenticated role).
-- Prisma connects as the database owner and bypasses RLS.
-- auth.user_id() is provided by Neon and returns the JWT sub claim.

-- ──────────────────────────────────────────────
-- Helper functions (SECURITY DEFINER bypasses RLS)
-- ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_tenant_member(p_tenant_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members
    WHERE "userId" = auth.user_id()
      AND "tenantId" = p_tenant_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_tenant_owner(p_tenant_id TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members
    WHERE "userId" = auth.user_id()
      AND "tenantId" = p_tenant_id
      AND "role" = 'OWNER'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ──────────────────────────────────────────────
-- 1. AUTH TABLES
-- ──────────────────────────────────────────────

-- users: read/update own only
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON "users"
  FOR SELECT USING ("id" = auth.user_id());
CREATE POLICY "users_update_own" ON "users"
  FOR UPDATE USING ("id" = auth.user_id());

-- sessions: read own only
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select_own" ON "sessions"
  FOR SELECT USING ("userId" = auth.user_id());

-- accounts: read own only
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts_select_own" ON "accounts"
  FOR SELECT USING ("userId" = auth.user_id());

-- verifications: no Data API access (Better Auth manages server-side)
ALTER TABLE "verifications" ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- 2. TENANT MANAGEMENT
-- ──────────────────────────────────────────────

-- tenants: read if member, update if owner
ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenants_select_member" ON "tenants"
  FOR SELECT USING (is_tenant_member("id"));
CREATE POLICY "tenants_update_owner" ON "tenants"
  FOR UPDATE USING (is_tenant_owner("id"));

-- tenant_members: read if member of that tenant, manage if owner
ALTER TABLE "tenant_members" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_members_select" ON "tenant_members"
  FOR SELECT USING (
    "userId" = auth.user_id()
    OR is_tenant_member("tenantId")
  );
CREATE POLICY "tenant_members_insert_owner" ON "tenant_members"
  FOR INSERT WITH CHECK (is_tenant_owner("tenantId"));
CREATE POLICY "tenant_members_delete_owner" ON "tenant_members"
  FOR DELETE USING (is_tenant_owner("tenantId"));

-- invites: any authenticated user can read (for accept-by-token flow),
-- only owner can manage
ALTER TABLE "invites" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_select" ON "invites"
  FOR SELECT USING (auth.user_id() IS NOT NULL);
CREATE POLICY "invites_insert_owner" ON "invites"
  FOR INSERT WITH CHECK (is_tenant_owner("tenantId"));
CREATE POLICY "invites_update_owner" ON "invites"
  FOR UPDATE USING (is_tenant_owner("tenantId"));
CREATE POLICY "invites_delete_owner" ON "invites"
  FOR DELETE USING (is_tenant_owner("tenantId"));

-- ──────────────────────────────────────────────
-- 3. TENANT-SCOPED DATA
-- ──────────────────────────────────────────────

-- entries: read all in tenant if member; create/update/delete own only
ALTER TABLE "entries" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entries_select_tenant" ON "entries"
  FOR SELECT USING (is_tenant_member("tenantId"));
CREATE POLICY "entries_insert_own" ON "entries"
  FOR INSERT WITH CHECK (
    "userId" = auth.user_id()
    AND is_tenant_member("tenantId")
  );
CREATE POLICY "entries_update_own" ON "entries"
  FOR UPDATE USING (
    "userId" = auth.user_id()
    AND is_tenant_member("tenantId")
  );
CREATE POLICY "entries_delete_own" ON "entries"
  FOR DELETE USING (
    "userId" = auth.user_id()
    AND is_tenant_member("tenantId")
  );

-- custom_checklist_items: CRUD if tenant member
ALTER TABLE "custom_checklist_items" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_checklist_items_select" ON "custom_checklist_items"
  FOR SELECT USING (is_tenant_member("tenantId"));
CREATE POLICY "custom_checklist_items_insert" ON "custom_checklist_items"
  FOR INSERT WITH CHECK (is_tenant_member("tenantId"));
CREATE POLICY "custom_checklist_items_update" ON "custom_checklist_items"
  FOR UPDATE USING (is_tenant_member("tenantId"));
CREATE POLICY "custom_checklist_items_delete" ON "custom_checklist_items"
  FOR DELETE USING (is_tenant_member("tenantId"));

-- attachments: CRUD if tenant member
ALTER TABLE "attachments" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attachments_select" ON "attachments"
  FOR SELECT USING (is_tenant_member("tenantId"));
CREATE POLICY "attachments_insert" ON "attachments"
  FOR INSERT WITH CHECK (is_tenant_member("tenantId"));
CREATE POLICY "attachments_update" ON "attachments"
  FOR UPDATE USING (is_tenant_member("tenantId"));
CREATE POLICY "attachments_delete" ON "attachments"
  FOR DELETE USING (is_tenant_member("tenantId"));

-- medications: CRUD if tenant member
ALTER TABLE "medications" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "medications_select" ON "medications"
  FOR SELECT USING (is_tenant_member("tenantId"));
CREATE POLICY "medications_insert" ON "medications"
  FOR INSERT WITH CHECK (is_tenant_member("tenantId"));
CREATE POLICY "medications_update" ON "medications"
  FOR UPDATE USING (is_tenant_member("tenantId"));
CREATE POLICY "medications_delete" ON "medications"
  FOR DELETE USING (is_tenant_member("tenantId"));

-- strategies: CRUD if tenant member
ALTER TABLE "strategies" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "strategies_select" ON "strategies"
  FOR SELECT USING (is_tenant_member("tenantId"));
CREATE POLICY "strategies_insert" ON "strategies"
  FOR INSERT WITH CHECK (is_tenant_member("tenantId"));
CREATE POLICY "strategies_update" ON "strategies"
  FOR UPDATE USING (is_tenant_member("tenantId"));
CREATE POLICY "strategies_delete" ON "strategies"
  FOR DELETE USING (is_tenant_member("tenantId"));

-- tenant_frameworks: read if member, manage if owner
ALTER TABLE "tenant_frameworks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_frameworks_select" ON "tenant_frameworks"
  FOR SELECT USING (is_tenant_member("tenantId"));
CREATE POLICY "tenant_frameworks_insert_owner" ON "tenant_frameworks"
  FOR INSERT WITH CHECK (is_tenant_owner("tenantId"));
CREATE POLICY "tenant_frameworks_delete_owner" ON "tenant_frameworks"
  FOR DELETE USING (is_tenant_owner("tenantId"));

-- ──────────────────────────────────────────────
-- 4. GLOBAL READ-ONLY (Diagnostic Framework Tables)
-- Any authenticated user can read; no writes via Data API.
-- ──────────────────────────────────────────────

ALTER TABLE "diagnostic_frameworks" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diagnostic_frameworks_select" ON "diagnostic_frameworks"
  FOR SELECT USING (auth.user_id() IS NOT NULL);

ALTER TABLE "criterion_poles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "criterion_poles_select" ON "criterion_poles"
  FOR SELECT USING (auth.user_id() IS NOT NULL);

ALTER TABLE "criteria" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "criteria_select" ON "criteria"
  FOR SELECT USING (auth.user_id() IS NOT NULL);

ALTER TABLE "framework_behavior_categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "framework_behavior_categories_select" ON "framework_behavior_categories"
  FOR SELECT USING (auth.user_id() IS NOT NULL);

ALTER TABLE "behavior_definitions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "behavior_definitions_select" ON "behavior_definitions"
  FOR SELECT USING (auth.user_id() IS NOT NULL);

ALTER TABLE "behavior_criterion_mappings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "behavior_criterion_mappings_select" ON "behavior_criterion_mappings"
  FOR SELECT USING (auth.user_id() IS NOT NULL);

ALTER TABLE "mood_descriptor_mappings" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mood_descriptor_mappings_select" ON "mood_descriptor_mappings"
  FOR SELECT USING (auth.user_id() IS NOT NULL);

ALTER TABLE "classification_rules" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classification_rules_select" ON "classification_rules"
  FOR SELECT USING (auth.user_id() IS NOT NULL);

ALTER TABLE "episode_thresholds" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "episode_thresholds_select" ON "episode_thresholds"
  FOR SELECT USING (auth.user_id() IS NOT NULL);

ALTER TABLE "signal_rules" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signal_rules_select" ON "signal_rules"
  FOR SELECT USING (auth.user_id() IS NOT NULL);

ALTER TABLE "signal_behaviors" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signal_behaviors_select" ON "signal_behaviors"
  FOR SELECT USING (auth.user_id() IS NOT NULL);
