-- ============================================================
-- Golf Charity Subscription Platform — Supabase Schema
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type subscription_plan as enum ('monthly', 'yearly');
create type subscription_status as enum ('active', 'inactive', 'cancelled', 'past_due', 'trialing');
create type draw_status as enum ('draft', 'simulation', 'published');
create type draw_type as enum ('random', 'algorithmic');
create type match_type as enum ('five_match', 'four_match', 'three_match');
create type winner_status as enum ('pending', 'verified', 'rejected', 'paid');
create type user_role as enum ('subscriber', 'admin');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role user_role not null default 'subscriber',
  phone text,
  country text default 'GB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CHARITIES
-- ============================================================

create table charities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text not null,
  short_description text,
  logo_url text,
  cover_image_url text,
  website_url text,
  category text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  total_received numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table charity_events (
  id uuid primary key default uuid_generate_v4(),
  charity_id uuid not null references charities(id) on delete cascade,
  title text not null,
  description text,
  event_date date not null,
  location text,
  image_url text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================

create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  plan subscription_plan not null,
  status subscription_status not null default 'inactive',
  amount numeric(10,2) not null,
  charity_id uuid references charities(id) on delete set null,
  charity_percentage numeric(5,2) not null default 10.00,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_user_active_idx on subscriptions(user_id)
  where status = 'active';

-- ============================================================
-- GOLF SCORES
-- ============================================================

create table golf_scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  score integer not null check (score >= 1 and score <= 45),
  played_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for efficient latest-5 queries
create index golf_scores_user_date_idx on golf_scores(user_id, played_date desc);

-- ============================================================
-- DRAWS
-- ============================================================

create table draws (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  draw_month integer not null check (draw_month between 1 and 12),
  draw_year integer not null,
  draw_type draw_type not null default 'random',
  status draw_status not null default 'draft',
  drawn_numbers integer[] not null default '{}',
  total_pool numeric(12,2) not null default 0,
  jackpot_pool numeric(12,2) not null default 0,
  jackpot_rollover numeric(12,2) not null default 0,
  five_match_pool numeric(12,2) not null default 0,
  four_match_pool numeric(12,2) not null default 0,
  three_match_pool numeric(12,2) not null default 0,
  participant_count integer not null default 0,
  simulation_data jsonb,
  published_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(draw_month, draw_year)
);

create table draw_entries (
  id uuid primary key default uuid_generate_v4(),
  draw_id uuid not null references draws(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  score_snapshot integer[] not null,
  created_at timestamptz not null default now(),
  unique(draw_id, user_id)
);

-- ============================================================
-- WINNERS
-- ============================================================

create table winners (
  id uuid primary key default uuid_generate_v4(),
  draw_id uuid not null references draws(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  entry_id uuid references draw_entries(id),
  match_type match_type not null,
  matched_numbers integer[] not null,
  prize_amount numeric(10,2) not null,
  status winner_status not null default 'pending',
  proof_url text,
  proof_submitted_at timestamptz,
  admin_notes text,
  verified_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CHARITY CONTRIBUTIONS (ledger)
-- ============================================================

create table charity_contributions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  subscription_id uuid references subscriptions(id),
  charity_id uuid not null references charities(id),
  amount numeric(10,2) not null,
  percentage numeric(5,2) not null,
  contribution_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

create table notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  is_read boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Update updated_at timestamps
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at();
create trigger subscriptions_updated_at before update on subscriptions
  for each row execute procedure update_updated_at();
create trigger golf_scores_updated_at before update on golf_scores
  for each row execute procedure update_updated_at();
create trigger draws_updated_at before update on draws
  for each row execute procedure update_updated_at();
create trigger winners_updated_at before update on winners
  for each row execute procedure update_updated_at();
create trigger charities_updated_at before update on charities
  for each row execute procedure update_updated_at();

-- Enforce rolling 5-score limit per user
create or replace function enforce_score_limit()
returns trigger language plpgsql as $$
declare
  oldest_id uuid;
  score_count integer;
begin
  select count(*) into score_count from golf_scores where user_id = new.user_id;
  if score_count >= 5 then
    select id into oldest_id
    from golf_scores
    where user_id = new.user_id
    order by played_date asc, created_at asc
    limit 1;
    delete from golf_scores where id = oldest_id;
  end if;
  return new;
end;
$$;

create trigger golf_scores_limit
  before insert on golf_scores
  for each row execute procedure enforce_score_limit();

-- Update charity total on contribution
create or replace function update_charity_total()
returns trigger language plpgsql as $$
begin
  update charities
  set total_received = total_received + new.amount
  where id = new.charity_id;
  return new;
end;
$$;

create trigger charity_contributions_total
  after insert on charity_contributions
  for each row execute procedure update_charity_total();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table golf_scores enable row level security;
alter table draws enable row level security;
alter table draw_entries enable row level security;
alter table winners enable row level security;
alter table charities enable row level security;
alter table charity_events enable row level security;
alter table charity_contributions enable row level security;
alter table notifications enable row level security;

-- Profiles
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles for select using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Subscriptions
create policy "Users can view own subscription" on subscriptions for select using (auth.uid() = user_id);
create policy "Service role full access subscriptions" on subscriptions using (auth.role() = 'service_role');

-- Golf Scores
create policy "Users can manage own scores" on golf_scores for all using (auth.uid() = user_id);
create policy "Admins can manage all scores" on golf_scores for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Draws (public read for published)
create policy "Anyone can view published draws" on draws for select using (status = 'published');
create policy "Admins can manage draws" on draws for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Draw Entries
create policy "Users can view own entries" on draw_entries for select using (auth.uid() = user_id);
create policy "Service role manages entries" on draw_entries using (auth.role() = 'service_role');

-- Winners
create policy "Users can view own winnings" on winners for select using (auth.uid() = user_id);
create policy "Users can upload proof" on winners for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Admins can manage winners" on winners for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Charities (public read)
create policy "Anyone can view active charities" on charities for select using (is_active = true);
create policy "Admins can manage charities" on charities for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Anyone can view charity events" on charity_events for select using (true);
create policy "Admins can manage charity events" on charity_events for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Charity Contributions
create policy "Users can view own contributions" on charity_contributions for select using (auth.uid() = user_id);
create policy "Service role manages contributions" on charity_contributions using (auth.role() = 'service_role');

-- Notifications
create policy "Users can manage own notifications" on notifications for all using (auth.uid() = user_id);

-- ============================================================
-- SEED DATA
-- ============================================================

insert into charities (name, slug, description, short_description, category, is_featured, is_active) values
(
  'Golf Foundation',
  'golf-foundation',
  'The Golf Foundation is dedicated to transforming the lives of young people through golf. We run programmes in schools and communities, helping children develop life skills, confidence, and a love for the sport.',
  'Transforming lives of young people through golf programmes.',
  'Youth Sport',
  true,
  true
),
(
  'Macmillan Cancer Support',
  'macmillan-cancer-support',
  'Macmillan Cancer Support provides medical, emotional, practical and financial support to people affected by cancer. Our golf events raise vital funds to help more people live life as fully as possible.',
  'Supporting people living with cancer through expert care.',
  'Health',
  true,
  true
),
(
  'Alzheimer''s Research UK',
  'alzheimers-research-uk',
  'Alzheimer''s Research UK is the UK''s leading dementia research charity. We fund pioneering research to transform the lives of people affected by dementia and related conditions.',
  'Pioneering research to defeat Alzheimer''s disease.',
  'Research',
  false,
  true
),
(
  'Prostate Cancer UK',
  'prostate-cancer-uk',
  'Prostate Cancer UK fights to help more men survive prostate cancer and enjoy a better quality of life. We invest in research, improve specialist care, and support men to navigate the healthcare system.',
  'Fighting prostate cancer through research and support.',
  'Health',
  false,
  true
),
(
  'Children in Need',
  'children-in-need',
  'BBC Children in Need helps children and young people across the UK who face disadvantage. We support projects that help children be safer, healthier, happier and more resilient.',
  'Helping disadvantaged children across the UK.',
  'Children',
  false,
  true
);
