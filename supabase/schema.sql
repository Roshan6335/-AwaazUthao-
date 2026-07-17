-- ============================================================
-- AWAAZ UTHAO — Database Schema
-- Run this once in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. SUPPORTERS TABLE (pledge / support form submissions)
create table supporters (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  pincode text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  email text not null,
  email_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Prevent the same email from pledging twice (basic duplicate guard)
create unique index supporters_email_unique on supporters (lower(email));

-- 2. MP / CONSTITUENCY DIRECTORY (static reference data — you fill this in)
create table mp_directory (
  id uuid primary key default gen_random_uuid(),
  pincode_prefix text not null,   -- first 3 digits, e.g. '110' matches New Delhi pincodes 110xxx
  constituency text not null,
  mp_name text not null,
  mp_email text not null
);

-- 3. VOICE WALL MESSAGES (public name + message, admin-approved before showing)
create table voice_messages (
  id uuid primary key default gen_random_uuid(),
  supporter_id uuid references supporters(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  message text not null check (char_length(message) between 5 and 280),
  agree_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

-- 4. AGREES (one row per person per message — enforces no double-count, no glitch)
create table message_agrees (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references voice_messages(id) on delete cascade,
  voter_fingerprint text not null,  -- anonymous cookie-based id, not personal data
  created_at timestamptz not null default now(),
  unique (message_id, voter_fingerprint)  -- <-- this line is what prevents double-agree
);

-- 4a. Trigger function: atomically keep agree_count in sync (no race conditions)
create or replace function increment_agree_count()
returns trigger as $$
begin
  update voice_messages set agree_count = agree_count + 1 where id = new.message_id;
  return new;
end;
$$ language plpgsql;

create trigger trg_increment_agree
after insert on message_agrees
for each row execute function increment_agree_count();

create or replace function decrement_agree_count()
returns trigger as $$
begin
  update voice_messages set agree_count = agree_count - 1 where id = old.message_id;
  return old;
end;
$$ language plpgsql;

create trigger trg_decrement_agree
after delete on message_agrees
for each row execute function decrement_agree_count();

-- 5. UPDATES (admin-published news/article posts — your mini-CMS)
create table updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  image_urls text[] default '{}',
  video_embed_url text,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- 6. PUSH SUBSCRIPTIONS (for web push notifications)
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

-- 7. ADMIN ALLOWLIST (only these emails can access /admin)
create table admin_users (
  email text primary key
);
-- After creating your Supabase Auth account, insert your own email here:
-- insert into admin_users (email) values ('your-email@example.com');

-- 8. STATS (single-row table — powers the live counter without
--    ever running a slow COUNT(*) over the whole supporters table)
create table stats (
  id int primary key default 1,
  total_supporters integer not null default 0,
  check (id = 1)
);
insert into stats (id, total_supporters) values (1, 0);

create or replace function bump_supporter_stat()
returns trigger as $$
begin
  update stats set total_supporters = total_supporters + 1 where id = 1;
  return new;
end;
$$ language plpgsql;

create trigger trg_bump_supporter_stat
after insert on supporters
for each row execute function bump_supporter_stat();

-- ============================================================
-- ROW LEVEL SECURITY — locks the database down by default
-- ============================================================

alter table supporters enable row level security;
alter table mp_directory enable row level security;
alter table voice_messages enable row level security;
alter table message_agrees enable row level security;
alter table updates enable row level security;
alter table push_subscriptions enable row level security;
alter table admin_users enable row level security;
alter table stats enable row level security;

create policy "public can read stats"
  on stats for select
  using (true);

-- Anyone can submit a pledge (insert only — never read others' rows)
create policy "public can insert supporters"
  on supporters for insert
  with check (true);

-- Nobody can SELECT supporters from the public API — only the admin
-- (admin operations use the service_role key which bypasses RLS entirely,
--  so no public read policy is created here on purpose)

-- MP directory is public read-only reference data
create policy "public can read mp directory"
  on mp_directory for select
  using (true);

-- Voice wall: public can insert a message (goes to 'pending')
create policy "public can insert voice message"
  on voice_messages for insert
  with check (status = 'pending');

-- Voice wall: public can only see APPROVED messages
create policy "public can read approved messages"
  on voice_messages for select
  using (status = 'approved');

-- Agrees: public can insert (one per fingerprint per message, enforced above)
create policy "public can insert agree"
  on message_agrees for insert
  with check (true);

-- Updates: public can read only published posts
create policy "public can read published updates"
  on updates for select
  using (published = true);

-- Push subscriptions: public can insert their own subscription
create policy "public can insert push subscription"
  on push_subscriptions for insert
  with check (true);

-- ============================================================
-- Indexes for performance at scale
-- ============================================================
create index idx_supporters_pincode on supporters (pincode);
create index idx_voice_messages_status on voice_messages (status, created_at desc);
create index idx_mp_directory_prefix on mp_directory (pincode_prefix);
