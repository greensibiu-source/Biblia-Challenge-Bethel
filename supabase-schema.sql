-- Biblia Challenge – Bethel Cloppenburg
-- Run in Supabase SQL Editor. Configure the first admin manually after signup.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 24),
  role text not null default 'player' check (role in ('player','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.levels (
  id integer primary key,
  name text not null,
  sort_order integer not null unique,
  pass_score integer not null default 168 check (pass_score between 0 and 210)
);

create table if not exists public.questions (
  id bigint generated always as identity primary key,
  level_id integer not null references public.levels(id) on delete cascade,
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options)='array' and jsonb_array_length(options)=4),
  correct_option smallint not null check (correct_option between 0 and 3),
  bible_reference text not null,
  explanation text,
  active boolean not null default true
);

create table if not exists public.competitions (
  id bigint generated always as identity primary key,
  title text not null,
  kind text not null check (kind in ('monthly','special')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  active boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  level_id integer not null references public.levels(id),
  competition_id bigint references public.competitions(id) on delete set null,
  score integer not null check (score between 0 and 210),
  passed boolean not null,
  completed_at timestamptz not null default now()
);

create or replace view public.leaderboard as
select p.id, p.username, coalesce(sum(a.score),0)::bigint as total_points
from public.profiles p left join public.attempts a on a.user_id=p.id
group by p.id,p.username
order by total_points desc, p.username asc;

alter table public.profiles enable row level security;
alter table public.levels enable row level security;
alter table public.questions enable row level security;
alter table public.competitions enable row level security;
alter table public.attempts enable row level security;

drop policy if exists "Profiles readable to signed-in users" on public.profiles;
create policy "Profiles readable to signed-in users" on public.profiles for select to authenticated using (true);
drop policy if exists "Users create own profile" on public.profiles;
create policy "Users create own profile" on public.profiles for insert to authenticated with check (auth.uid()=id and role='player');
drop policy if exists "Users update own username" on public.profiles;
create policy "Users update own username" on public.profiles for update to authenticated using (auth.uid()=id) with check (auth.uid()=id and role='player');

drop policy if exists "Levels readable" on public.levels;
create policy "Levels readable" on public.levels for select to authenticated using (true);
drop policy if exists "Questions readable" on public.questions;
create policy "Questions readable" on public.questions for select to authenticated using (active=true);
drop policy if exists "Competitions readable" on public.competitions;
create policy "Competitions readable" on public.competitions for select to authenticated using (true);
drop policy if exists "Users read own attempts" on public.attempts;
create policy "Users read own attempts" on public.attempts for select to authenticated using (auth.uid()=user_id);
-- Score submission is intentionally not opened to clients yet: the next development step
-- is a server-side RPC that validates each answer and the 60-second timer before awarding points.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,username)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'username',''), split_part(new.email,'@',1)));
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

insert into public.levels(id,name,sort_order,pass_score) values
(1,'Începător I',1,168),(2,'Începător II',2,168),(3,'Explorator I',3,168),(4,'Explorator II',4,168),
(5,'Cunoscător I',5,168),(6,'Cunoscător II',6,168),(7,'Avansat I',7,168),(8,'Avansat II',8,168),
(9,'Expert I',9,168),(10,'Expert II',10,168),(11,'Slujitor I',11,168),(12,'Slujitor II',12,168),
(13,'Teolog I',13,168),(14,'Teolog II',14,168),(15,'Maestru I',15,168),(16,'Maestru II',16,168),
(17,'Maestru al Scripturii I',17,168),(18,'Maestru al Scripturii II',18,168),(19,'Campion biblic I',19,168),(20,'Campion biblic II',20,168)
on conflict (id) do update set name=excluded.name,sort_order=excluded.sort_order,pass_score=excluded.pass_score;
