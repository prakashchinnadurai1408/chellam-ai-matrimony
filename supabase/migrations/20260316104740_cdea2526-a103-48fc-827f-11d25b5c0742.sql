
-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  gender TEXT,
  date_of_birth DATE,
  religion TEXT,
  community TEXT,
  caste TEXT,
  bio TEXT,
  education TEXT,
  education_detail TEXT,
  profession TEXT,
  income TEXT,
  location TEXT,
  state TEXT,
  height TEXT,
  marital_status TEXT DEFAULT 'Never Married',
  photo_url TEXT,
  family_type TEXT,
  father_occupation TEXT,
  mother_occupation TEXT,
  siblings TEXT,
  family_values TEXT,
  rashi TEXT,
  nakshatra TEXT,
  manglik BOOLEAN DEFAULT false,
  guna_score INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  profile_complete BOOLEAN DEFAULT false,
  match_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Partner preferences table
CREATE TABLE public.partner_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  min_age INTEGER DEFAULT 21,
  max_age INTEGER DEFAULT 35,
  preferred_religion TEXT,
  preferred_communities TEXT[],
  preferred_education TEXT[],
  preferred_locations TEXT[],
  preferred_marital_status TEXT,
  min_height TEXT,
  max_height TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles: authenticated users can view all, only own can be modified
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Partner preferences: only own
CREATE POLICY "Users can view their own preferences"
  ON public.partner_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.partner_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.partner_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Timestamps triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partner_preferences_updated_at
  BEFORE UPDATE ON public.partner_preferences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, phone)
  VALUES (NEW.id, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
