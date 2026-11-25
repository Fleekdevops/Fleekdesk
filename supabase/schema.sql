-- FleekDesk schema. Run in Supabase SQL editor.
create extension if not exists pg_trgm;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  plan text not null default 'free' check (plan in ('free','pro')),
  pro_until timestamptz,
  analyses_used int not null default 0,
  consented_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  phone text,
  budget_min_kes bigint,
  budget_max_kes bigint,
  locations text[] not null default '{}',
  deal_stage text,
  next_step text,
  language text,
  analysis jsonb not null,
  search_text text not null default '',
  created_at timestamptz not null default now()
);
create index clients_user_created on public.clients (user_id, created_at desc);
create index clients_search_trgm on public.clients using gin (search_text gin_trgm_ops);

alter table public.profiles enable row level security;
alter table public.clients enable row level security;

-- Users can READ their profile but never update it (plan flag is admin-only via service role).
create policy "own profile read" on public.profiles for select using (auth.uid() = id);

create policy "own clients select" on public.clients for select using (auth.uid() = user_id);
create policy "own clients insert" on public.clients for insert with check (auth.uid() = user_id);
create policy "own clients update" on public.clients for update using (auth.uid() = user_id);
create policy "own clients delete" on public.clients for delete using (auth.uid() = user_id);

-- Auto-create profile on signup
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, consented_at)
  values (new.id, new.email, nullif(new.raw_user_meta_data->>'consented_at','')::timestamptz);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomic quota check + increment. Free limit = 5. Returns false when blocked.
create function public.consume_analysis() returns boolean
language plpgsql security definer set search_path = public as $$
declare ok boolean;
begin
  update public.profiles
     set analyses_used = analyses_used + 1
   where id = auth.uid()
     and ((plan = 'pro' and (pro_until is null or pro_until > now())) or analyses_used < 5);
  ok := found;
  return ok;
end $$;

create function public.refund_analysis() returns void
language sql security definer set search_path = public as $$
  update public.profiles set analyses_used = greatest(analyses_used - 1, 0) where id = auth.uid();
$$;

revoke all on function public.consume_analysis() from public, anon;
revoke all on function public.refund_analysis() from public, anon;
grant execute on function public.consume_analysis() to authenticated;
grant execute on function public.refund_analysis() to authenticated;
