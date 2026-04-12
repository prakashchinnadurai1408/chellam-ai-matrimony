
-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  message TEXT,
  related_user_id UUID,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Blocked users table
CREATE TABLE public.blocked_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL,
  blocked_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks"
ON public.blocked_users FOR SELECT
USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others"
ON public.blocked_users FOR INSERT
WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
ON public.blocked_users FOR DELETE
USING (auth.uid() = blocker_id);

-- Reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
ON public.reports FOR SELECT
USING (auth.uid() = reporter_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Success stories table
CREATE TABLE public.success_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  partner_name TEXT NOT NULL,
  title TEXT NOT NULL,
  story TEXT NOT NULL,
  photo_url TEXT,
  wedding_date DATE,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved stories"
ON public.success_stories FOR SELECT
USING (approved = true OR auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create stories"
ON public.success_stories FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stories"
ON public.success_stories FOR UPDATE
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete own stories"
ON public.success_stories FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for notification on interest received
CREATE OR REPLACE FUNCTION public.notify_interest()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_user_id, link)
  VALUES (
    NEW.receiver_id,
    'interest',
    'New Interest Received',
    'Someone has expressed interest in your profile',
    NEW.sender_id,
    '/interests'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_interest_created
AFTER INSERT ON public.interests
FOR EACH ROW
EXECUTE FUNCTION public.notify_interest();

-- Trigger for notification on message received
CREATE OR REPLACE FUNCTION public.notify_message()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_user_id, link)
  SELECT 
    CASE WHEN c.user1_id = NEW.sender_id THEN c.user2_id ELSE c.user1_id END,
    'message',
    'New Message',
    LEFT(NEW.content, 100),
    NEW.sender_id,
    '/messages'
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_message_created
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_message();

-- Trigger for notification on profile view
CREATE OR REPLACE FUNCTION public.notify_profile_view()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, related_user_id, link)
  VALUES (
    NEW.viewed_id,
    'profile_view',
    'Profile Viewed',
    'Someone viewed your profile',
    NEW.viewer_id,
    '/who-viewed-me'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_profile_view
AFTER INSERT ON public.profile_views
FOR EACH ROW
EXECUTE FUNCTION public.notify_profile_view();
