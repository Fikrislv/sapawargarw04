
-- 1. Add 'warga' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'warga';

-- 2. Extend profiles with full_name, phone, rt_number
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS rt_number public.rt_type;

-- 3. Profile self-update policy (warga can edit their profile)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 4. user_roles: allow self-insert of 'warga' role at signup (trigger uses SECURITY DEFINER so this is mainly defensive)
-- (no changes needed, trigger handles it)

-- 5. Reports: add user_id and title; make warga reporter fields nullable for logged-in flow
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.reports ALTER COLUMN nama_pelapor DROP NOT NULL;
ALTER TABLE public.reports ALTER COLUMN whatsapp DROP NOT NULL;
ALTER TABLE public.reports ALTER COLUMN alamat DROP NOT NULL;

-- 6. Reports RLS — replace public insert with authenticated-only
DROP POLICY IF EXISTS "Anyone can create a report" ON public.reports;

CREATE POLICY "Authenticated users can create their own report"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Warga can view their own reports"
  ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 7. Comments table
CREATE TABLE IF NOT EXISTS public.report_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;

-- Helper: can user access this report?
CREATE OR REPLACE FUNCTION public.can_access_report(_user_id uuid, _report_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = _report_id AND (
      r.user_id = _user_id
      OR public.has_role(_user_id, 'admin_rw'::public.app_role)
      OR (public.has_role(_user_id, 'admin_rt'::public.app_role)
          AND r.rt_tujuan::text = public.get_user_wilayah(_user_id)::text)
    )
  )
$$;

CREATE POLICY "Users can view comments on accessible reports"
  ON public.report_comments FOR SELECT TO authenticated
  USING (public.can_access_report(auth.uid(), report_id));

CREATE POLICY "Users can comment on accessible reports"
  ON public.report_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_access_report(auth.uid(), report_id));

CREATE INDEX IF NOT EXISTS idx_report_comments_report ON public.report_comments(report_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON public.reports(user_id);

-- 8. Update handle_new_user trigger to capture full_name, phone, rt_number and assign 'warga' role by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _rt public.rt_type;
  _wilayah public.wilayah_type;
BEGIN
  _rt := NULLIF(NEW.raw_user_meta_data->>'rt_number','')::public.rt_type;
  _wilayah := COALESCE(_rt::text, 'RW04')::public.wilayah_type;

  INSERT INTO public.profiles (id, email, wilayah, full_name, phone, rt_number)
  VALUES (
    NEW.id,
    NEW.email,
    _wilayah,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    _rt
  );

  -- Default role = warga
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'warga'::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Profile insert policy (defensive — trigger inserts but allow self-insert too)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
