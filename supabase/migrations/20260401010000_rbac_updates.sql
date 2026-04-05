-- 1. Create helper function to check for multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- 2. Update Profiles Policy
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins and moderators can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins and moderators can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

-- 3. Update Messages Policy
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins and moderators can view all messages"
ON public.messages FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

DROP POLICY IF EXISTS "Admins can delete messages" ON public.messages;
CREATE POLICY "Admins and moderators can delete messages"
ON public.messages FOR DELETE
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

-- 4. Update Conversations Policy
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
CREATE POLICY "Admins and moderators can view all conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

DROP POLICY IF EXISTS "Admins can delete conversations" ON public.conversations;
CREATE POLICY "Admins and moderators can delete conversations"
ON public.conversations FOR DELETE
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

-- 5. Give success_stories manage powers to admin and moderators (We created that table previously)
-- We previously set "Authenticated users can insert/update/delete", but let's lock it down
DROP POLICY IF EXISTS "Authenticated users can insert stories" ON public.success_stories;
CREATE POLICY "Admins and moderators can insert stories"
    ON public.success_stories FOR INSERT TO authenticated 
    WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

DROP POLICY IF EXISTS "Authenticated users can update stories" ON public.success_stories;
CREATE POLICY "Admins and moderators can update stories"
    ON public.success_stories FOR UPDATE TO authenticated 
    USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));

DROP POLICY IF EXISTS "Authenticated users can delete stories" ON public.success_stories;
CREATE POLICY "Admins and moderators can delete stories"
    ON public.success_stories FOR DELETE TO authenticated 
    USING (public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'moderator'::app_role]));
