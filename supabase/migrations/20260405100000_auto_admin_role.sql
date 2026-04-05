-- Migration to automatically assign admin role to admin@chellam.dev
-- Created: 2026-04-05

-- 1. Create a function to handle new user role assignment
CREATE OR REPLACE FUNCTION public.handle_admin_role_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- If the user has the specific admin email, assign the admin role
  IF NEW.email = 'admin@chellam.dev' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Also ensure they have a profile
    INSERT INTO public.profiles (user_id, first_name, last_name, profile_complete)
    VALUES (NEW.id, 'System', 'Admin', true)
    ON CONFLICT (user_id) DO UPDATE 
    SET profile_complete = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create a trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_admin_role_assignment();

-- 3. Retroactively apply to existing admin user if they already signed up
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@chellam.dev';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    INSERT INTO public.profiles (user_id, first_name, last_name, profile_complete)
    VALUES (v_user_id, 'System', 'Admin', true)
    ON CONFLICT (user_id) DO UPDATE 
    SET profile_complete = true;
  END IF;
END;
$$;
