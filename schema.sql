-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- DROP EXISTING TABLES TO AVOID CONFLICTS
drop table if exists messages cascade;
drop table if exists diet_plans cascade;
drop table if exists progress_photos cascade;
drop table if exists weight_logs cascade;
drop table if exists profiles cascade;

-- PROFILES TABLE
create table profiles (
  id uuid references auth.users(id) primary key,
  role text not null check (role in ('client', 'trainer')),
  full_name text not null,
  trainer_id uuid references auth.users(id),
  weight numeric,
  target_weight numeric,
  start_date date,
  end_date date,
  plan text,
  fees_paid numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- WEIGHT LOGS TABLE
create table weight_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  date date not null,
  weight numeric not null,
  sleep numeric default 0,
  water numeric default 0,
  calories integer default 0,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PROGRESS PHOTOS TABLE
create table progress_photos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  date date not null,
  url text not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DIET PLANS TABLE
create table diet_plans (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references auth.users(id) not null,
  trainer_id uuid references auth.users(id) not null,
  meals jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- MESSAGES TABLE
create table messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references auth.users(id) not null,
  receiver_id uuid references auth.users(id) not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ENABLE ROW LEVEL SECURITY
alter table profiles enable row level security;
alter table weight_logs enable row level security;
alter table progress_photos enable row level security;
alter table diet_plans enable row level security;
alter table messages enable row level security;

-- POLICIES

-- Profiles: users can read their own profile. Trainers can read their clients' profiles.
create policy "Users can read own profile" on profiles for select using (auth.uid() = id);
create policy "Trainers can read client profiles" on profiles for select using (auth.uid() = trainer_id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Logs & Photos: users can read/insert their own. Trainers can read clients.
create policy "Users manage own logs" on weight_logs for all using (auth.uid() = user_id);
create policy "Trainers read client logs" on weight_logs for select using (
  exists (select 1 from profiles where id = weight_logs.user_id and trainer_id = auth.uid())
);

create policy "Users manage own photos" on progress_photos for all using (auth.uid() = user_id);
create policy "Trainers read client photos" on progress_photos for select using (
  exists (select 1 from profiles where id = progress_photos.user_id and trainer_id = auth.uid())
);

-- Diet Plans: clients read, trainers manage.
create policy "Clients read own diet plans" on diet_plans for select using (auth.uid() = client_id);
create policy "Trainers manage client diet plans" on diet_plans for all using (auth.uid() = trainer_id);

-- Messages: sender or receiver can view/insert.
create policy "Users can view own messages" on messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can insert own messages" on messages for insert with check (auth.uid() = sender_id);
