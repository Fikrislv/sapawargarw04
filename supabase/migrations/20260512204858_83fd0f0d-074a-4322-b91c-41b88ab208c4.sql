
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin_rw', 'admin_rt');
CREATE TYPE public.wilayah_type AS ENUM ('RT01', 'RT02', 'RT03', 'RT04', 'RT05', 'RW04');
CREATE TYPE public.report_status AS ENUM ('Menunggu', 'Diproses', 'Selesai');
CREATE TYPE public.report_kategori AS ENUM ('Keamanan', 'Sampah', 'Infrastruktur', 'Lainnya');
CREATE TYPE public.rt_type AS ENUM ('RT01', 'RT02', 'RT03', 'RT04', 'RT05');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  wilayah public.wilayah_type NOT NULL DEFAULT 'RW04',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles (separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_wilayah(_user_id UUID)
RETURNS public.wilayah_type
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT wilayah FROM public.profiles WHERE id = _user_id
$$;

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  nama_pelapor TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  alamat TEXT NOT NULL,
  rt_tujuan public.rt_type NOT NULL,
  kategori public.report_kategori NOT NULL,
  deskripsi TEXT NOT NULL,
  foto_url TEXT,
  status public.report_status NOT NULL DEFAULT 'Menunggu',
  tanggapan_admin TEXT,
  tanggapan_at TIMESTAMPTZ,
  tanggapan_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS: profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admin RW can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin_rw'));

-- RLS: user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin RW can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin_rw'));

-- RLS: reports
CREATE POLICY "Anyone can create a report" ON public.reports
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admin RW can view all reports" ON public.reports
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin_rw'));

CREATE POLICY "Admin RT can view their wilayah reports" ON public.reports
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'admin_rt')
    AND rt_tujuan::text = public.get_user_wilayah(auth.uid())::text
  );

CREATE POLICY "Admin RW can update all reports" ON public.reports
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin_rw'));

CREATE POLICY "Admin RT can update their wilayah reports" ON public.reports
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin_rt')
    AND rt_tujuan::text = public.get_user_wilayah(auth.uid())::text
  );

-- Auto create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, wilayah)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'wilayah')::public.wilayah_type, 'RW04')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for report photos
INSERT INTO storage.buckets (id, name, public) VALUES ('report-photos', 'report-photos', true);

CREATE POLICY "Anyone can upload report photos" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'report-photos');

CREATE POLICY "Anyone can view report photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'report-photos');
