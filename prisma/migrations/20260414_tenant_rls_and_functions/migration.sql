-- Add missing RLS policies and helper functions for tenant management via Neon Data API
-- Required for ST-060 Phase 5: web app CRUD operations without Prisma

-- 1. INSERT policy on tenants: any authenticated user can create a project
CREATE POLICY "tenants_insert_authenticated" ON "tenants"
  FOR INSERT WITH CHECK (auth.user_id() IS NOT NULL);

-- 2. DELETE policy on tenants: owner only
CREATE POLICY "tenants_delete_owner" ON "tenants"
  FOR DELETE USING (is_tenant_owner("id"));

-- 3. create_tenant_with_owner: atomic function that creates a tenant and adds
--    the current user as OWNER in tenant_members. Needed because the INSERT
--    policy on tenant_members requires is_tenant_owner(), which can't be true
--    for a tenant that doesn't exist yet.
CREATE OR REPLACE FUNCTION create_tenant_with_owner(
  p_id TEXT,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_purpose TEXT DEFAULT 'ONGOING_TRACKING',
  p_teen_full_name TEXT DEFAULT NULL,
  p_teen_nickname TEXT DEFAULT NULL,
  p_teen_birthday TIMESTAMP DEFAULT NULL,
  p_teen_favorite_color TEXT DEFAULT NULL,
  p_teen_interests TEXT DEFAULT NULL,
  p_teen_school TEXT DEFAULT NULL,
  p_teen_favorite_subject TEXT DEFAULT NULL,
  p_teen_has_iep BOOLEAN DEFAULT FALSE,
  p_teen_diagnosis TEXT DEFAULT NULL,
  p_teen_other_health TEXT DEFAULT NULL,
  p_onset_date TIMESTAMP DEFAULT NULL,
  p_family_history TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id TEXT;
  v_member_id TEXT;
BEGIN
  v_user_id := auth.user_id();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Create the tenant
  INSERT INTO "tenants" (
    "id", "name", "description", "purpose",
    "teenFullName", "teenNickname", "teenBirthday", "teenFavoriteColor",
    "teenInterests", "teenSchool", "teenFavoriteSubject", "teenHasIep",
    "teenDiagnosis", "teenOtherHealth", "onsetDate", "familyHistory",
    "createdAt", "updatedAt"
  ) VALUES (
    p_id, p_name, p_description, p_purpose,
    p_teen_full_name, p_teen_nickname, p_teen_birthday, p_teen_favorite_color,
    p_teen_interests, p_teen_school, p_teen_favorite_subject, p_teen_has_iep,
    p_teen_diagnosis, p_teen_other_health, p_onset_date, p_family_history,
    NOW(), NOW()
  );

  -- Add the creator as OWNER
  v_member_id := gen_random_uuid()::TEXT;
  INSERT INTO "tenant_members" ("id", "userId", "tenantId", "role", "createdAt", "updatedAt")
  VALUES (v_member_id, v_user_id, p_id, 'OWNER', NOW(), NOW());

  -- Link the default diagnostic framework (dsm5-bipolar)
  INSERT INTO "tenant_frameworks" ("id", "tenantId", "frameworkId", "createdAt", "updatedAt")
  SELECT gen_random_uuid()::TEXT, p_id, df."id", NOW(), NOW()
  FROM "diagnostic_frameworks" df
  WHERE df."slug" = 'dsm5-bipolar'
  LIMIT 1;

  RETURN p_id;
END;
$$;

-- Grant execute to authenticated role (Neon Data API)
GRANT EXECUTE ON FUNCTION create_tenant_with_owner TO authenticated;

-- 4. accept_invite: atomic function that validates an invite token, adds the
--    user to the tenant, and marks the invite as used.
CREATE OR REPLACE FUNCTION accept_invite(p_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id TEXT;
  v_invite RECORD;
  v_member_id TEXT;
  v_existing BOOLEAN;
BEGIN
  v_user_id := auth.user_id();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Find valid invite
  SELECT * INTO v_invite FROM "invites"
  WHERE "token" = p_token
    AND "status" = 'PENDING'
    AND "expiresAt" > NOW();

  IF v_invite IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite';
  END IF;

  -- Check if already a member
  SELECT EXISTS (
    SELECT 1 FROM "tenant_members"
    WHERE "userId" = v_user_id AND "tenantId" = v_invite."tenantId"
  ) INTO v_existing;

  IF v_existing THEN
    -- Already a member, just mark invite as accepted
    UPDATE "invites" SET "status" = 'ACCEPTED', "updatedAt" = NOW()
    WHERE "id" = v_invite."id";
    RETURN v_invite."tenantId";
  END IF;

  -- Add as member
  v_member_id := gen_random_uuid()::TEXT;
  INSERT INTO "tenant_members" ("id", "userId", "tenantId", "role", "createdAt", "updatedAt")
  VALUES (v_member_id, v_user_id, v_invite."tenantId", v_invite."role", NOW(), NOW());

  -- Mark invite as accepted
  UPDATE "invites" SET "status" = 'ACCEPTED', "updatedAt" = NOW()
  WHERE "id" = v_invite."id";

  RETURN v_invite."tenantId";
END;
$$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION accept_invite TO authenticated;
