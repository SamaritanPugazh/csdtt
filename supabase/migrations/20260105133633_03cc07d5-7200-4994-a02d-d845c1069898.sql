-- Drop the existing authenticated-only policy
DROP POLICY IF EXISTS "Authenticated users can view timetable" ON public.timetable;

-- Create a new policy that allows anyone to read the timetable
CREATE POLICY "Anyone can view timetable" 
ON public.timetable 
FOR SELECT 
USING (true);