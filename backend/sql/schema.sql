-- =============================================================
-- ACESSÍVEL URBANO — Schema completo
-- Cole TUDO no SQL Editor do Supabase e execute
-- =============================================================

-- Função compartilhada para atualizar updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =============================================================
-- 1. USERS — autenticação customizada (bcrypt)
-- =============================================================
create table if not exists public.users (
  id                    uuid          not null default gen_random_uuid(),
  email                 text          not null,
  password_hash         text          not null,
  is_active             boolean       not null default true,
  failed_login_attempts integer       not null default 0,
  locked_until          timestamptz   null,
  last_sign_in_at       timestamptz   null,
  created_at            timestamptz   not null default now(),
  updated_at            timestamptz   not null default now(),
  role                  text          not null default 'user',
  constraint users_pkey       primary key (id),
  constraint users_email_key  unique (email),
  constraint users_role_check check (role = any (array['user', 'admin']))
);
create unique index if not exists idx_users_email on public.users using btree (email);
drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
  before update on users
  for each row execute function update_updated_at();

-- =============================================================
-- 2. PROFILES — dados públicos do usuário
-- =============================================================
create table if not exists public.profiles (
  id         uuid        not null default gen_random_uuid(),
  user_id    uuid        not null,
  name       text        not null,
  avatar_url text        null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_pkey         primary key (id),
  constraint profiles_user_id_fkey foreign key (user_id) references users (id) on delete cascade
);
create unique index if not exists idx_profiles_user_id on public.profiles using btree (user_id);
drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- =============================================================
-- 2b. PASSWORD_RESET_CODES — códigos OTP de recuperação de senha
-- =============================================================
create table if not exists public.password_reset_codes (
  id         uuid        not null default gen_random_uuid(),
  user_id    uuid        not null,
  code_hash  text        not null,
  expires_at timestamptz not null,
  used       boolean     not null default false,
  attempts   integer     not null default 0,
  created_at timestamptz not null default now(),
  constraint password_reset_codes_pkey      primary key (id),
  constraint password_reset_codes_user_fkey foreign key (user_id) references users (id) on delete cascade
);
create index if not exists idx_prc_user    on public.password_reset_codes using btree (user_id);
create index if not exists idx_prc_expires on public.password_reset_codes using btree (expires_at);

-- =============================================================
-- 3. REGIONS
-- =============================================================
create table if not exists public.regions (
  id         uuid        not null default gen_random_uuid(),
  name       text        not null,
  created_at timestamptz not null default now(),
  constraint regions_pkey     primary key (id),
  constraint regions_name_key unique (name)
);

-- =============================================================
-- 4. PLACES
-- =============================================================
create table if not exists public.places (
  id         uuid           not null default gen_random_uuid(),
  name       text           not null,
  category   text           not null,
  address    text           not null,
  latitude   numeric(9, 6)  not null,
  longitude  numeric(9, 6)  not null,
  avg_rating numeric(2, 1)  not null default 0,
  created_by uuid           not null,
  region_id  uuid           null,
  created_at timestamptz    not null default now(),
  updated_at timestamptz    not null default now(),
  constraint places_pkey            primary key (id),
  constraint places_created_by_fkey foreign key (created_by) references users (id) on delete set null,
  constraint places_region_id_fkey  foreign key (region_id)  references regions (id) on delete set null
);
create index if not exists idx_places_category   on public.places using btree (category);
create index if not exists idx_places_created_by on public.places using btree (created_by);
create index if not exists idx_places_region_id  on public.places using btree (region_id);
drop trigger if exists trg_places_updated_at on places;
create trigger trg_places_updated_at
  before update on places
  for each row execute function update_updated_at();

-- =============================================================
-- 5. REVIEWS
-- =============================================================
create table if not exists public.reviews (
  id         uuid        not null default gen_random_uuid(),
  place_id   uuid        not null,
  user_id    uuid        not null,
  rating     integer     not null,
  comment    text        null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_pkey                 primary key (id),
  constraint reviews_place_id_user_id_key unique (place_id, user_id),
  constraint reviews_place_id_fkey        foreign key (place_id) references places (id) on delete cascade,
  constraint reviews_user_id_fkey         foreign key (user_id)  references users  (id) on delete cascade,
  constraint reviews_rating_check         check (rating >= 1 and rating <= 5)
);

-- Função e trigger para recalcular avg_rating
create or replace function update_avg_rating()
returns trigger as $$
declare
  v_place_id uuid;
begin
  v_place_id := coalesce(new.place_id, old.place_id);
  update places
     set avg_rating = coalesce((select round(avg(rating)::numeric, 1) from reviews where place_id = v_place_id), 0)
   where id = v_place_id;
  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists trg_update_avg_rating on reviews;
create trigger trg_update_avg_rating
  after insert or delete or update on reviews
  for each row execute function update_avg_rating();

-- =============================================================
-- 6. REPORTS — denúncias
-- =============================================================
create table if not exists public.reports (
  id          uuid        not null default gen_random_uuid(),
  review_id   uuid        not null,
  reported_by uuid        not null,
  reason      text        not null,
  status      text        not null default 'pending',
  created_at  timestamptz not null default now(),
  constraint reports_pkey         primary key (id),
  constraint reports_review_fkey  foreign key (review_id)   references reviews (id) on delete cascade,
  constraint reports_user_fkey    foreign key (reported_by) references users   (id) on delete cascade,
  constraint reports_reason_check check (reason = any (array['offensive', 'wrong_info', 'spam', 'other'])),
  constraint reports_status_check check (status = any (array['pending', 'resolved', 'dismissed']))
);

-- =============================================================
-- 7. FAVORITES
-- =============================================================
create table if not exists public.favorites (
  id         uuid        not null default gen_random_uuid(),
  user_id    uuid        not null,
  place_id   uuid        not null,
  created_at timestamptz not null default now(),
  constraint favorites_pkey                 primary key (id),
  constraint favorites_user_id_place_id_key unique (user_id, place_id),
  constraint favorites_place_id_fkey        foreign key (place_id) references places (id) on delete cascade,
  constraint favorites_user_id_fkey         foreign key (user_id)  references users  (id) on delete cascade
);

-- =============================================================
-- 8. ACCESSIBILITY_CHECKLIST
-- =============================================================
create table if not exists public.accessibility_checklist (
  id                  uuid        not null default gen_random_uuid(),
  review_id           uuid        not null,
  ramp                boolean     not null default false,
  sidewalk            boolean     not null default false,
  sound_signaling     boolean     not null default false,
  tactile_floor       boolean     not null default false,
  disabled_parking    boolean     not null default false,
  elevator            boolean     not null default false,
  accessible_bathroom boolean     not null default false,
  created_at          timestamptz not null default now(),
  constraint accessibility_checklist_pkey           primary key (id),
  constraint accessibility_checklist_review_id_key  unique (review_id),
  constraint accessibility_checklist_review_id_fkey foreign key (review_id) references reviews (id) on delete cascade
);

-- =============================================================
-- 9. SUPPORT_TICKETS
-- =============================================================
create table if not exists public.support_tickets (
  id         uuid        not null default gen_random_uuid(),
  user_id    uuid        not null,
  subject    text        not null,
  category   text        not null,
  status     text        not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_pkey           primary key (id),
  constraint support_tickets_user_fkey      foreign key (user_id) references users (id) on delete cascade,
  constraint support_tickets_category_check check (category = any (array['bug', 'question', 'other'])),
  constraint support_tickets_status_check   check (status   = any (array['open', 'in_progress', 'closed']))
);
drop trigger if exists trg_support_tickets_updated_at on support_tickets;
create trigger trg_support_tickets_updated_at
  before update on support_tickets
  for each row execute function update_updated_at();

-- =============================================================
-- 10. SUPPORT_MESSAGES
-- =============================================================
create table if not exists public.support_messages (
  id         uuid        not null default gen_random_uuid(),
  ticket_id  uuid        not null,
  sender_id  uuid        not null,
  message    text        not null,
  created_at timestamptz not null default now(),
  constraint support_messages_pkey            primary key (id),
  constraint support_messages_sender_id_fkey  foreign key (sender_id) references users           (id) on delete cascade,
  constraint support_messages_ticket_id_fkey  foreign key (ticket_id) references support_tickets (id) on delete cascade
);
create index if not exists idx_support_messages_ticket_id on public.support_messages using btree (ticket_id);

-- =============================================================
-- VIEWS
-- =============================================================
create or replace view public.places_accessibility_level
with (security_invoker = on) as
select
  id, name, avg_rating,
  case
    when avg_rating >= 4   then 'green'
    when avg_rating >= 2.5 then 'orange'
    else                        'red'
  end as accessibility_level
from places;

create or replace view public.ranking_by_region
with (security_invoker = on) as
select
  p.id       as place_id,
  p.name     as place_name,
  p.category,
  p.address,
  p.avg_rating,
  r.name     as region_name,
  rank() over (partition by p.region_id order by p.avg_rating desc) as rank
from places p
left join regions r on r.id = p.region_id;

create or replace view public.stats_by_region
with (security_invoker = on) as
select
  r.id                             as region_id,
  r.name                           as region_name,
  count(p.id)                      as total_places,
  round(avg(p.avg_rating), 1)      as avg_rating,
  count(rv.id)                     as total_reviews,
  sum(ac.ramp::integer)            as total_ramp,
  sum(ac.sidewalk::integer)        as total_sidewalk,
  sum(ac.sound_signaling::integer) as total_sound_signaling,
  sum(ac.tactile_floor::integer)   as total_tactile_floor,
  sum(ac.disabled_parking::integer) as total_disabled_parking,
  sum(ac.elevator::integer)        as total_elevator,
  sum(ac.accessible_bathroom::integer) as total_accessible_bathroom
from regions r
left join places              p  on p.region_id = r.id
left join reviews             rv on rv.place_id  = p.id
left join accessibility_checklist ac on ac.review_id = rv.id
group by r.id, r.name;

-- =============================================================
-- RLS — Row Level Security
-- =============================================================
-- Como o backend usa SERVICE_ROLE_KEY (bypassa RLS), habilitamos
-- RLS sem políticas para garantir que ninguém acesse via anon key.
alter table public.users                   enable row level security;
alter table public.password_reset_codes    enable row level security;
alter table public.profiles                enable row level security;
alter table public.regions                 enable row level security;
alter table public.places                  enable row level security;
alter table public.reviews                 enable row level security;
alter table public.reports                 enable row level security;
alter table public.favorites               enable row level security;
alter table public.accessibility_checklist enable row level security;
alter table public.support_tickets         enable row level security;
alter table public.support_messages        enable row level security;
