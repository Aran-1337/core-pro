-- ========================================================
-- 1. Store (Books) Tables
-- ========================================================

-- Create books table
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  price_digital NUMERIC NOT NULL DEFAULT 0,
  price_physical NUMERIC NOT NULL DEFAULT 0,
  format TEXT NOT NULL DEFAULT 'BOTH', -- 'DIGITAL', 'PHYSICAL', 'BOTH'
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create book_orders table (tracking student purchases)
CREATE TABLE IF NOT EXISTS public.book_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  format TEXT NOT NULL, -- 'DIGITAL' or 'PHYSICAL'
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'DELIVERED' (for physical) or 'COMPLETED' (for digital)
  shipping_address TEXT,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- 2. Live Sessions Tables
-- ========================================================

-- Create live_sessions table
CREATE TABLE IF NOT EXISTS public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  instructor_name TEXT NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  max_seats INTEGER NOT NULL DEFAULT 0,
  level TEXT NOT NULL DEFAULT 'ALL', -- 'BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL'
  zoom_link TEXT,
  session_type TEXT NOT NULL DEFAULT 'PRIVATE', -- 'PRIVATE', 'REVIEW'
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create session_bookings table
CREATE TABLE IF NOT EXISTS public.session_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, session_id) -- A user can only book once per session
);

-- Enable RLS for basic security (Policies can be expanded later)
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_bookings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published books & sessions
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.books FOR SELECT
  USING (is_published = true);

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.live_sessions FOR SELECT
  USING (is_published = true);

-- Temporary relaxed policies for development
CREATE POLICY "Allow all operations for development" ON public.books FOR ALL USING (true);
CREATE POLICY "Allow all operations for development" ON public.book_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations for development" ON public.live_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations for development" ON public.session_bookings FOR ALL USING (true);
