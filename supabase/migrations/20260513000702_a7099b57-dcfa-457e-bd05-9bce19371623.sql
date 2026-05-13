
-- 1. Storage: report-photos bucket
DROP POLICY IF EXISTS "Anyone can upload report photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view report photos" ON storage.objects;

CREATE POLICY "Authenticated users upload to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'report-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners can update own report photos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'report-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'report-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Owners or admin RW can delete report photos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'report-photos'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin_rw'::public.app_role)
  )
);

-- Note: bucket remains public=true so getPublicUrl works for direct file access.
-- Removing the broad SELECT policy stops bucket-wide listing via the API.

-- 2. Realtime authorization for report_comments topic
-- Topic format used by client: comments-<report_id>
CREATE POLICY "Users can subscribe to accessible report comment topics"
ON realtime.messages FOR SELECT TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'comments-%' THEN
      public.can_access_report(
        auth.uid(),
        substring(realtime.topic() from 10)::uuid
      )
    ELSE false
  END
);

-- 3. Revoke EXECUTE on SECURITY DEFINER helpers from anon/authenticated.
-- These are only used inside RLS policies / triggers (run as definer), so direct API access is unnecessary.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.get_user_wilayah(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.can_access_report(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
