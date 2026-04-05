-- ==========================================
-- ENTERPRISE SCHEMA EXPANSION (PHASE 1)
-- ==========================================
-- This migration transforms the MVP tables into a highly structured 
-- relational model required for the 100M+ User AI Matchmaking architecture.

-- -----------------------------------------------------------------------------
-- 1. LOOKUP TABLES (Demographics, Culture, Education, Lifestyle)
-- -----------------------------------------------------------------------------
CREATE TABLE public.religions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE public.castes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  religion_id UUID REFERENCES public.religions(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(religion_id, name)
);

CREATE TABLE public.subcastes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caste_id UUID REFERENCES public.castes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  UNIQUE(caste_id, name)
);

CREATE TABLE public.gotras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE public.education_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  hierarchy_weight INT DEFAULT 0
);

CREATE TABLE public.degrees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  education_level_id UUID REFERENCES public.education_levels(id),
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  country VARCHAR(100)
);

CREATE TABLE public.industries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE public.occupations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_id UUID REFERENCES public.industries(id),
  name VARCHAR(100) NOT NULL,
  UNIQUE(industry_id, name)
);

CREATE TABLE public.income_brackets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency VARCHAR(10) DEFAULT 'INR',
  min_value NUMERIC(15,2) DEFAULT 0,
  max_value NUMERIC(15,2),
  label VARCHAR(100) NOT NULL
);

-- Astrology Foundation
CREATE TABLE public.nakshatras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.rashis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.dosha_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  severity INT DEFAULT 1
);

-- Lifestyle Foundation
CREATE TABLE public.diet_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.drinking_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.smoking_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE public.hobbies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50),
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(10)
);

-- -----------------------------------------------------------------------------
-- 2. PROFILE RELATIONAL EXPANSION (N:M Mappings)
-- -----------------------------------------------------------------------------
-- Instead of JSONB columns on `profiles`, we normalize for AI querying.

CREATE TABLE public.profile_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  degree_id UUID REFERENCES public.degrees(id),
  university_id UUID REFERENCES public.universities(id),
  graduation_year INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.profile_career (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  occupation_id UUID REFERENCES public.occupations(id),
  employer_name VARCHAR(255),
  income_bracket_id UUID REFERENCES public.income_brackets(id),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.profile_hobbies (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hobby_id UUID REFERENCES public.hobbies(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (user_id, hobby_id)
);

CREATE TABLE public.profile_languages (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  language_id UUID REFERENCES public.languages(id) ON DELETE CASCADE NOT NULL,
  proficiency VARCHAR(20) DEFAULT 'native',
  PRIMARY KEY (user_id, language_id)
);

CREATE TABLE public.profile_horoscope_details (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nakshatra_id UUID REFERENCES public.nakshatras(id),
  rashi_id UUID REFERENCES public.rashis(id),
  birth_city VARCHAR(100),
  birth_time TIME,
  is_manglik BOOLEAN DEFAULT false
);

CREATE TABLE public.profile_doshas (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  dosha_id UUID REFERENCES public.dosha_types(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (user_id, dosha_id)
);

CREATE TABLE public.partner_preferences_advanced (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  age_min INT DEFAULT 18,
  age_max INT DEFAULT 50,
  height_min DECIMAL(5,2),
  height_max DECIMAL(5,2),
  preferred_income_min_id UUID REFERENCES public.income_brackets(id),
  preferred_education_level_id UUID REFERENCES public.education_levels(id),
  must_match_horoscope BOOLEAN DEFAULT false,
  must_match_diet BOOLEAN DEFAULT false
);

-- -----------------------------------------------------------------------------
-- 3. AI & ML MATCHMAKING ENGINE FOUNDATION
-- -----------------------------------------------------------------------------
CREATE TABLE public.ai_user_embeddings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  feature_vector FLOAT8[], -- Could use pgvector for similarity search
  behavior_vector FLOAT8[],
  personality_vector FLOAT8[],
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.ai_match_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_b UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  overall_score DECIMAL(5,4),
  preference_score DECIMAL(5,4),
  horoscope_score DECIMAL(5,4),
  behavioral_score DECIMAL(5,4),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_a, user_b)
);

CREATE TABLE public.ai_behavior_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- "view", "like", "skip", "chat_start"
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_duration_sec INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 4. ENTERPRISE TRUST & SAFETY (eKYC & Fraud)
-- -----------------------------------------------------------------------------
CREATE TABLE public.id_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- 'aadhaar', 'passport', 'driving_license'
  document_hash VARCHAR(255), -- Privacy preserving checksum
  status VARCHAR(20) DEFAULT 'pending',
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.ai_fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  risk_score DECIMAL(5,4) NOT NULL,
  flag_reason VARCHAR(255), -- e.g. "duplicate_photo", "scam_message_pattern"
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  moderator_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'warn', 'suspend', 'ban', 'force_verify'
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 5. FAMILY & NETWORK GRAPH
-- -----------------------------------------------------------------------------
CREATE TABLE public.family_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  father_occupation VARCHAR(100),
  mother_occupation VARCHAR(100),
  native_place VARCHAR(100),
  family_type VARCHAR(20), -- 'nuclear', 'joint'
  family_values VARCHAR(20), -- 'orthodox', 'traditional', 'moderate', 'liberal'
  sibling_count INT DEFAULT 0
);

-- ENABLE ROW LEVEL SECURITY FOR ALL NEW TABLES
ALTER TABLE public.religions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.castes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcastes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gotras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.degrees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occupations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nakshatras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rashis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dosha_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drinking_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smoking_habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_career ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_horoscope_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_doshas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_preferences_advanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_user_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_fraud_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_profiles ENABLE ROW LEVEL SECURITY;

-- EXAMPLE POLICIES (Read-only for lookups, owner access for profile records)
CREATE POLICY "Public lookups are viewable by all" ON public.religions FOR SELECT USING (true);
CREATE POLICY "Public lookups are viewable by all" ON public.castes FOR SELECT USING (true);
CREATE POLICY "Public lookups are viewable by all" ON public.education_levels FOR SELECT USING (true);
CREATE POLICY "Public lookups are viewable by all" ON public.occupations FOR SELECT USING (true);
CREATE POLICY "Public lookups are viewable by all" ON public.hobbies FOR SELECT USING (true);
CREATE POLICY "Public lookups are viewable by all" ON public.languages FOR SELECT USING (true);
-- ... Expand to others if needed.

CREATE POLICY "Users can manage their own advanced preferences" ON public.partner_preferences_advanced
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own AI scores" ON public.ai_match_scores
FOR SELECT TO authenticated USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Ensure Admins and Moderators have full access to Trust & Safety
CREATE POLICY "Admins moderate reports" ON public.user_reports FOR ALL TO authenticated 
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

CREATE POLICY "Admins issue moderation actions" ON public.moderation_actions FOR ALL TO authenticated 
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

CREATE POLICY "Admins view fraud flags" ON public.ai_fraud_flags FOR SELECT TO authenticated 
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));
