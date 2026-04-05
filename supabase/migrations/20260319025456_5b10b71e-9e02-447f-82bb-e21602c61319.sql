
-- Membership tiers enum
CREATE TYPE public.membership_tier AS ENUM ('free', 'premium', 'concierge');

-- Interest status enum
CREATE TYPE public.interest_status AS ENUM ('pending', 'accepted', 'declined');

-- Payment settings (admin-configurable UPI)
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_id text,
  qr_image_url text,
  premium_monthly_price integer NOT NULL DEFAULT 499,
  premium_annual_price integer NOT NULL DEFAULT 3999,
  concierge_monthly_price integer NOT NULL DEFAULT 1999,
  concierge_annual_price integer NOT NULL DEFAULT 15999,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view payment settings"
  ON public.payment_settings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage payment settings"
  ON public.payment_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default row
INSERT INTO public.payment_settings (id) VALUES (gen_random_uuid());

-- Memberships table
CREATE TABLE public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier membership_tier NOT NULL DEFAULT 'free',
  plan_type text DEFAULT 'monthly',
  started_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own membership"
  ON public.memberships FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all memberships"
  ON public.memberships FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own membership"
  ON public.memberships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Payment requests (user submits proof)
CREATE TABLE public.payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier membership_tier NOT NULL,
  plan_type text NOT NULL DEFAULT 'monthly',
  amount integer NOT NULL,
  upi_transaction_id text,
  screenshot_url text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment requests"
  ON public.payment_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment requests"
  ON public.payment_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payment requests"
  ON public.payment_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Interests table
CREATE TABLE public.interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status interest_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interests involving them"
  ON public.interests FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send interests"
  ON public.interests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update interests they received"
  ON public.interests FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete interests they sent"
  ON public.interests FOR DELETE TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Admins can manage all interests"
  ON public.interests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Shortlists table
CREATE TABLE public.shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, profile_id)
);

ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own shortlists"
  ON public.shortlists FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Daily matches table
CREATE TABLE public.daily_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  match_user_id uuid NOT NULL,
  compatibility_score integer NOT NULL DEFAULT 0,
  match_reasons jsonb DEFAULT '[]',
  match_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, match_user_id, match_date)
);

ALTER TABLE public.daily_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily matches"
  ON public.daily_matches FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert daily matches"
  ON public.daily_matches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Profile views table
CREATE TABLE public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id uuid NOT NULL,
  viewed_id uuid NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert profile views"
  ON public.profile_views FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Users can see who viewed them"
  ON public.profile_views FOR SELECT TO authenticated
  USING (auth.uid() = viewed_id OR auth.uid() = viewer_id);

CREATE POLICY "Admins can view all profile views"
  ON public.profile_views FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for payment screenshots and QR codes
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-uploads', 'payment-uploads', true);

CREATE POLICY "Authenticated users can upload payment files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-uploads');

CREATE POLICY "Anyone can view payment files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-uploads');

CREATE POLICY "Admins can delete payment files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-uploads' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for interests
ALTER PUBLICATION supabase_realtime ADD TABLE public.interests;
