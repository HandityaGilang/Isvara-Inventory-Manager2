-- FIX LENGKAP UNTUK SUPABASE LOGIN
-- Salin semua kode di bawah ini dan jalankan di SQL Editor Supabase

-- 1. Buat ulang tabel users jika belum ada
CREATE TABLE IF NOT EXISTS public.users (
  username text PRIMARY KEY,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'STAFF')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Pastikan user 'owner' ada
INSERT INTO public.users (username, password, role)
VALUES ('owner', 'owner123', 'OWNER')
ON CONFLICT (username) DO UPDATE 
SET password = 'owner123', role = 'OWNER';

-- 3. Aktifkan RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Hapus policy lama jika ada (untuk menghindari duplikat)
DROP POLICY IF EXISTS "Public Access Users" ON public.users;

-- 5. Buat policy akses publik (Bolehkah semua orang membaca/menulis tabel ini? Ya, untuk aplikasi ini)
CREATE POLICY "Public Access Users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 6. PENTING: Reload schema cache agar API Supabase sadar ada tabel baru
NOTIFY pgrst, 'reload config';
