create table if not exists public.password_reset_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  token varchar(6) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone
);

-- Add indexes
create index if not exists password_reset_tokens_user_id_idx on public.password_reset_tokens(user_id);
create index if not exists password_reset_tokens_token_idx on public.password_reset_tokens(token);

-- RLS Policies
alter table public.password_reset_tokens enable row level security;

create policy "Users can see their own password reset tokens"
  on public.password_reset_tokens for select
  using (auth.uid() = user_id);

create policy "Service role can manage all password reset tokens"
  on public.password_reset_tokens for all
  using (auth.role() = 'service_role');