ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Add unique constraint for upsert
ALTER TABLE public.enrollments 
DROP CONSTRAINT IF EXISTS unique_user_course;

ALTER TABLE public.enrollments 
ADD CONSTRAINT unique_user_course UNIQUE (user_id, course_id);
