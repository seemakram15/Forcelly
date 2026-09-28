-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  avatar_url text,
  score integer default 100,
  total_completed integer default 0,
  total_missed integer default 0,
  created_at timestamptz default now()
);

-- Reminders table
create table if not exists public.reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  category text not null default 'custom',
  times jsonb not null default '[]',
  days_of_week integer[] not null default '{0,1,2,3,4,5,6}',
  is_active boolean default true,
  proof_required boolean default true,
  created_at timestamptz default now()
);

-- Reminder occurrences (each time it fires)
create table if not exists public.reminder_occurrences (
  id uuid default gen_random_uuid() primary key,
  reminder_id uuid references public.reminders(id) on delete cascade not null,
  scheduled_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending','snoozed','completed','missed')),
  proof_url text,
  completed_at timestamptz,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.reminders enable row level security;
alter table public.reminder_occurrences enable row level security;

-- Profiles: users can only see/edit their own
create policy "profiles_own" on public.profiles for all using (auth.uid() = id);

-- Reminders: users can only access their own
create policy "reminders_own" on public.reminders for all using (auth.uid() = user_id);

-- Occurrences: users can access occurrences of their reminders
create policy "occurrences_own" on public.reminder_occurrences for all
  using (reminder_id in (select id from public.reminders where user_id = auth.uid()));

-- Storage bucket for proof images
insert into storage.buckets (id, name, public) values ('proofs', 'proofs', true)
  on conflict (id) do nothing;

create policy "proofs_upload" on storage.objects for insert
  with check (bucket_id = 'proofs' and auth.uid() is not null);

create policy "proofs_read" on storage.objects for select
  using (bucket_id = 'proofs');

create policy "proofs_delete_own" on storage.objects for delete
  using (bucket_id = 'proofs' and (storage.foldername(name))[1] = auth.uid()::text);
