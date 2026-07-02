CREATE TABLE IF NOT EXISTS public.course_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.course_renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own renewals" 
ON public.course_renewals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own renewals" 
ON public.course_renewals 
FOR SELECT 
USING (auth.uid() = user_id);

-- Temporary relaxed policy for admin development (admins can do anything)
CREATE POLICY "Allow all operations for development" ON public.course_renewals FOR ALL USING (true);
