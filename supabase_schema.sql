-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. PRODUCTS TABLE
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  seller_sku text unique not null,
  shop_sku text,
  style_name text not null,
  category text,
  distribution_channel text,
  size_s numeric default 0,
  size_m numeric default 0,
  size_l numeric default 0,
  size_xl numeric default 0,
  size_xxl numeric default 0,
  size_xxxl numeric default 0,
  size_onesize numeric default 0,
  total_stock numeric default 0,
  price numeric default 0,
  cost numeric default 0,
  shipping_cost numeric default 0,
  platform_commission numeric default 0,
  discount numeric default 0,
  tax numeric default 0,
  admin_fee numeric default 0,
  commission numeric default 0,
  status text,
  notes text,
  "imageUrl" text,
  images text[],
  nett_receive numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. SALES RECORDS TABLE
create table if not exists public.sales_records (
  id uuid default gen_random_uuid() primary key,
  date text,
  seller_sku text,
  style_name text,
  type text,
  qty numeric,
  price numeric,
  total numeric,
  remark text,
  remaining_stock numeric,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. ACTIVITY LOGS TABLE
create table if not exists public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  timestamp bigint,
  date text,
  user_name text,
  user_role text,
  action text,
  item text,
  old_val text,
  new_val text,
  source text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. SETTINGS TABLE
create table if not exists public.settings (
  key text primary key,
  value jsonb
);

-- 5. USERS TABLE (New)
create table if not exists public.users (
  username text primary key,
  password text not null, -- Store hashed password
  role text not null check (role in ('OWNER', 'ADMIN', 'STAFF')),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Seed default owner if not exists
insert into public.users (username, password, role)
values ('owner', 'owner123', 'OWNER')
on conflict (username) do nothing;

-- 6. STORAGE BUCKET
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 7. RLS POLICIES
-- Enable RLS
alter table public.products enable row level security;
alter table public.sales_records enable row level security;
alter table public.activity_logs enable row level security;
alter table public.settings enable row level security;
alter table public.users enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "Public Access Products" on public.products;
drop policy if exists "Public Access Sales" on public.sales_records;
drop policy if exists "Public Access Logs" on public.activity_logs;
drop policy if exists "Public Access Settings" on public.settings;
drop policy if exists "Public Access Users" on public.users;
drop policy if exists "Public Access Bucket" on storage.objects;
drop policy if exists "Public Insert Bucket" on storage.objects;

-- Create permissive policies (Allow All for Anon)
create policy "Public Access Products" on public.products for all using (true) with check (true);
create policy "Public Access Sales" on public.sales_records for all using (true) with check (true);
create policy "Public Access Logs" on public.activity_logs for all using (true) with check (true);
create policy "Public Access Settings" on public.settings for all using (true) with check (true);
create policy "Public Access Users" on public.users for all using (true) with check (true);

-- Storage policies
create policy "Public Access Bucket" on storage.objects for all using ( bucket_id = 'product-images' );
create policy "Public Insert Bucket" on storage.objects for insert with check ( bucket_id = 'product-images' );
