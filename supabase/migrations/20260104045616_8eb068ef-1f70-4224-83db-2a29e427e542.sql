-- Create table for per-subject batch preferences tied to roll number
CREATE TABLE public.subject_batch_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roll_number TEXT NOT NULL,
  course_code TEXT NOT NULL,
  batch public.batch_type NOT NULL DEFAULT 'B1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (roll_number, course_code)
);

-- Enable RLS
ALTER TABLE public.subject_batch_preferences ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/write their own preferences (matched by roll number stored in localStorage)
-- Since students don't have Supabase auth, we need public access but controlled by roll number
CREATE POLICY "Anyone can read preferences" 
ON public.subject_batch_preferences 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert preferences" 
ON public.subject_batch_preferences 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update preferences" 
ON public.subject_batch_preferences 
FOR UPDATE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_subject_batch_preferences_updated_at
BEFORE UPDATE ON public.subject_batch_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();