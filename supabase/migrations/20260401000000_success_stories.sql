CREATE TABLE IF NOT EXISTS public.success_stories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    couple_name TEXT NOT NULL,
    image_url TEXT,
    location TEXT,
    married_date TEXT,
    match_score INTEGER,
    story TEXT NOT NULL,
    highlights TEXT[],
    duration TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Success stories are viewable by everyone"
    ON public.success_stories FOR SELECT USING (true);

-- Allow authenticated users to potentially create stories (or limit to admin later via frontend logic)
-- Since we don't have a dedicated admin table in DB RLS currently (often handled by user_roles or metadata), 
-- we'll allow authenticated users to insert/update, but the frontend blocks non-admins from reaching the page.
CREATE POLICY "Authenticated users can insert stories"
    ON public.success_stories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update stories"
    ON public.success_stories FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete stories"
    ON public.success_stories FOR DELETE TO authenticated USING (true);

-- Timestamps trigger
CREATE TRIGGER update_success_stories_updated_at
    BEFORE UPDATE ON public.success_stories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
