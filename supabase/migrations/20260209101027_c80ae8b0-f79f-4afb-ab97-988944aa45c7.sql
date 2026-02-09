-- Add split_students and num_batches columns to subjects table (replacing credit_hours logic)
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS split_students boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS num_batches integer DEFAULT 2;

-- Add teacher_code to teachers table for custom editable ID
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS teacher_code text;

-- Create course_units table for syllabus
CREATE TABLE IF NOT EXISTS public.course_units (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  unit_number integer NOT NULL CHECK (unit_number >= 1 AND unit_number <= 5),
  unit_name text NOT NULL,
  syllabus text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(subject_id, unit_number)
);

-- Enable RLS on course_units
ALTER TABLE public.course_units ENABLE ROW LEVEL SECURITY;

-- Create policies for course_units
CREATE POLICY "Anyone can view course units" 
ON public.course_units 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage course units" 
ON public.course_units 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on course_units
CREATE TRIGGER update_course_units_updated_at
BEFORE UPDATE ON public.course_units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();