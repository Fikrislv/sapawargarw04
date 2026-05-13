
-- 1) Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'report-photos';

-- 2) Drop any prior SELECT policies on report-photos and add a strict one
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND (qual LIKE '%report-photos%' OR with_check LIKE '%report-photos%')
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Auth can read report photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'report-photos' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin_rw'::public.app_role)
    OR public.has_role(auth.uid(), 'admin_rt'::public.app_role)
  )
);

-- 3) Convert existing foto_url values from full public URLs to storage paths
UPDATE public.reports
SET foto_url = regexp_replace(foto_url, '^.*/object/public/report-photos/', '')
WHERE foto_url IS NOT NULL AND foto_url LIKE '%/object/public/report-photos/%';

-- 4) Drop redundant PII columns from reports (data still lives in profiles)
ALTER TABLE public.reports DROP COLUMN IF EXISTS nama_pelapor;
ALTER TABLE public.reports DROP COLUMN IF EXISTS whatsapp;
