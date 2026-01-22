-- Drop existing policy that requires authentication
DROP POLICY IF EXISTS "Authenticated users can view active announcements" ON public.announcements;

-- Create new policy that allows anyone to view active announcements
CREATE POLICY "Anyone can view active announcements" 
ON public.announcements 
FOR SELECT 
USING ((is_active = true) OR has_role(auth.uid(), 'admin'::app_role));