ALTER PUBLICATION supabase_realtime ADD TABLE public.report_comments;
ALTER TABLE public.report_comments REPLICA IDENTITY FULL;