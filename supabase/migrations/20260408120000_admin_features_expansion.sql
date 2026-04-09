-- ==========================================
-- ADMIN FEATURES EXPANSION
-- Adds tables and columns required for the
-- full BRD admin panel feature set.
-- ==========================================

-- 1. Account status on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason TEXT,
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMPTZ;

-- 2. Support Tickets (FR-SUP-01 to FR-SUP-11)
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number   BIGSERIAL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject         TEXT NOT NULL,
  description     TEXT,
  category        VARCHAR(50) NOT NULL DEFAULT 'general',
  priority        VARCHAR(20) NOT NULL DEFAULT 'medium',
  status          VARCHAR(30) NOT NULL DEFAULT 'new',
  assigned_to     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes  TEXT,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets"
  ON public.support_tickets FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

-- 3. Matchmaking Configuration (FR-MM-01)
CREATE TABLE IF NOT EXISTS public.matchmaking_config (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key   VARCHAR(100) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description  TEXT,
  updated_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.matchmaking_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage matchmaking config"
  ON public.matchmaking_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read matchmaking config"
  ON public.matchmaking_config FOR SELECT TO authenticated
  USING (true);

-- Insert default algorithm weights (must sum to 100)
INSERT INTO public.matchmaking_config (config_key, config_value, description) VALUES
  ('weights', '{"age": 20, "religion": 25, "caste": 15, "education": 15, "profession": 10, "location": 10, "height": 5}',
   'Relative importance of each attribute in the match score (values should sum to 100)'),
  ('age_flexibility', '"5"', 'Default age range flexibility in years above/below preference'),
  ('boost_verified', '"true"', 'Boost verified profiles higher in search results'),
  ('daily_match_count', '"10"', 'Number of AI-selected daily matches per user'),
  ('require_photo', '"false"', 'Only include profiles with photos in match results')
ON CONFLICT (config_key) DO NOTHING;

-- 4. Notification Templates (FR-NOT-02)
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key    VARCHAR(100) UNIQUE NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  channels     TEXT[] DEFAULT ARRAY['in_app'],
  is_active    BOOLEAN NOT NULL DEFAULT true,
  updated_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage notification templates"
  ON public.notification_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed default event templates
INSERT INTO public.notification_templates (event_key, title, body, channels) VALUES
  ('welcome',             'Welcome to Chellam!',            'Your account has been created. Complete your profile to start finding matches.',      ARRAY['email', 'in_app']),
  ('profile_verified',    'Profile Verified ✓',             'Congratulations! Your profile has been verified. You now have a verified badge.',      ARRAY['email', 'in_app', 'sms']),
  ('profile_rejected',    'Verification Update',            'Your profile verification was not approved. Please review the feedback and resubmit.',  ARRAY['email', 'in_app']),
  ('new_match',           'New Match Found!',               'We found a great match for you today. Check out your daily matches.',                   ARRAY['push', 'in_app']),
  ('interest_received',   'Someone is Interested!',         '{{name}} has sent you an interest. View their profile and respond.',                   ARRAY['push', 'in_app', 'email']),
  ('message_received',    'New Message',                    'You have a new message. Log in to reply.',                                              ARRAY['push', 'in_app']),
  ('subscription_expiry', 'Subscription Expiring Soon',     'Your {{plan}} plan expires in {{days}} days. Renew to keep enjoying premium features.', ARRAY['email', 'sms', 'in_app']),
  ('subscription_active', 'Subscription Activated',         'Your {{plan}} plan is now active. Enjoy unlimited access to premium features.',         ARRAY['email', 'in_app'])
ON CONFLICT (event_key) DO NOTHING;

-- 5. Admin Audit Log (FR-SEC-02)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action       VARCHAR(100) NOT NULL,
  target_type  VARCHAR(50),
  target_id    UUID,
  details      JSONB,
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs"
  ON public.admin_audit_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

-- Trigger to auto-update updated_at on support_tickets
CREATE OR REPLACE FUNCTION public.update_support_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_support_ticket_updated_at();
