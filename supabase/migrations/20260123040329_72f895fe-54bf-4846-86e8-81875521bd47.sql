-- Add display_duration column to announcements table (in seconds, null means no auto-dismiss)
ALTER TABLE public.announcements 
ADD COLUMN display_duration integer DEFAULT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN public.announcements.display_duration IS 'Duration in seconds for auto-dismissing the announcement. NULL means it stays until manually dismissed.';