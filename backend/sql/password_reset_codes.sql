-- =============================================================
-- ACESSÍVEL URBANO — Códigos OTP de recuperação de senha
-- Cole no SQL Editor do Supabase e execute.
-- (também já incluído em schema.sql para instalações novas)
-- =============================================================
create table if not exists public.password_reset_codes (
  id         uuid        not null default gen_random_uuid(),
  user_id    uuid        not null,
  code_hash  text        not null,            -- hash bcrypt do código de 6 dígitos
  expires_at timestamptz not null,            -- validade (ex: agora + 10 min)
  used       boolean     not null default false,
  attempts   integer     not null default 0,  -- tentativas erradas de digitar o código
  created_at timestamptz not null default now(),
  constraint password_reset_codes_pkey      primary key (id),
  constraint password_reset_codes_user_fkey foreign key (user_id) references users (id) on delete cascade
);
create index if not exists idx_prc_user    on public.password_reset_codes using btree (user_id);
create index if not exists idx_prc_expires on public.password_reset_codes using btree (expires_at);

-- Backend usa SERVICE_ROLE_KEY (bypassa RLS); habilitamos RLS sem políticas
-- para bloquear acesso via anon key.
alter table public.password_reset_codes enable row level security;
