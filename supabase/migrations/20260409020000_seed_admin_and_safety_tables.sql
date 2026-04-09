-- ==========================================
-- SEED ADMIN USER + MISSING SAFETY TABLES
-- ==========================================

-- 1. Seed admin@chellam.dev / Admin@1408 into auth.users
--    The trigger from 20260405100000_auto_admin_role.sql will
--    automatically assign the admin role on INSERT.
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Only create if the user doesn't already exist
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@chellam.dev';

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@chellam.dev',
      crypt('Admin@1408', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"first_name":"System","last_name":"Admin"}',
      FALSE,
      now(),
      now()
    );
  END IF;

  -- Ensure admin role is assigned (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Ensure admin profile exists
  INSERT INTO public.profiles (user_id, first_name, last_name, profile_complete)
  VALUES (v_user_id, 'System', 'Admin', true)
  ON CONFLICT (user_id) DO UPDATE SET profile_complete = true;
END;
$$;


-- 2. User Reports table (referenced in AdminDashboard, AdminReports, AdminVerification)
CREATE TABLE IF NOT EXISTS public.user_reports (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category        VARCHAR(50) NOT NULL DEFAULT 'inappropriate',
  reason          TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'open',
  resolved_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user reports"
  ON public.user_reports FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

CREATE POLICY "Users can create reports"
  ON public.user_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);


-- 3. Moderation Actions (referenced in AdminVerification, AdminReports)
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type      VARCHAR(100) NOT NULL,
  reason           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage moderation actions"
  ON public.moderation_actions FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));


-- 4. ID Verifications (referenced in AdminVerification)
CREATE TABLE IF NOT EXISTS public.id_verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type   VARCHAR(100) DEFAULT 'profile_review',
  status          VARCHAR(50) NOT NULL DEFAULT 'pending',
  verified_at     TIMESTAMPTZ,
  verified_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.id_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage id verifications"
  ON public.id_verifications FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

CREATE POLICY "Users can view own verifications"
  ON public.id_verifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);


-- 5. AI Fraud Flags (referenced in AdminReports)
CREATE TABLE IF NOT EXISTS public.ai_fraud_flags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  flag_type    VARCHAR(100),
  details      JSONB,
  is_resolved  BOOLEAN NOT NULL DEFAULT false,
  resolved_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_fraud_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fraud flags"
  ON public.ai_fraud_flags FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));
