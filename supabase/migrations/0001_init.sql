-- ============================================================================
-- Kik-Mort — Étape 1 : schéma initial (users, declarations, votes) + RLS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: users
-- Profil applicatif 1-1 avec auth.users (Supabase Auth).
-- ----------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- Tout joueur authentifié peut voir tous les profils (classement public).
create policy "users_select_all"
  on public.users for select
  to authenticated
  using (true);

-- Un joueur ne peut modifier que son propre profil.
create policy "users_update_own"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Création automatique du profil à l'inscription (bypass RLS via SECURITY DEFINER).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Table: declarations
-- Une déclaration = un joueur annonce le décès d'une célébrité.
-- Le score du déclarant est calculé à la clôture (somme des votes).
-- ----------------------------------------------------------------------------
create type public.declaration_status as enum ('open', 'closed');

create table public.declarations (
  id uuid primary key default gen_random_uuid(),
  celebrity_name text not null,
  declared_by uuid not null references public.users (id) on delete cascade,
  status public.declaration_status not null default 'open',
  score_awarded integer,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index declarations_declared_by_idx on public.declarations (declared_by);
create index declarations_status_idx on public.declarations (status);

alter table public.declarations enable row level security;

-- Toutes les déclarations sont visibles par les joueurs authentifiés.
create policy "declarations_select_all"
  on public.declarations for select
  to authenticated
  using (true);

-- Un joueur ne peut créer une déclaration qu'en son propre nom.
create policy "declarations_insert_own"
  on public.declarations for insert
  to authenticated
  with check (declared_by = auth.uid());

-- Pas de policy UPDATE/DELETE pour les joueurs : la clôture et le calcul de
-- score passent uniquement par la fonction close_declaration() (SECURITY
-- DEFINER) ci-dessous, afin qu'un joueur ne puisse pas s'auto-attribuer de
-- points.

-- ----------------------------------------------------------------------------
-- Table: votes
-- Chaque joueur (sauf le déclarant) vote une fois par déclaration avec
-- deux toggles indépendants : "Connu" (1pt) et "Émotion" (1pt).
-- ----------------------------------------------------------------------------
create table public.votes (
  id uuid primary key default gen_random_uuid(),
  declaration_id uuid not null references public.declarations (id) on delete cascade,
  voter_id uuid not null references public.users (id) on delete cascade,
  known boolean not null default false,
  emotion boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (declaration_id, voter_id)
);

create index votes_declaration_id_idx on public.votes (declaration_id);

alter table public.votes enable row level security;

-- Les votes sont visibles par tous les joueurs authentifiés (dépouillement
-- transparent en temps réel).
create policy "votes_select_all"
  on public.votes for select
  to authenticated
  using (true);

-- Un joueur ne peut voter qu'en son propre nom, pas sur sa propre
-- déclaration, et uniquement tant qu'elle est ouverte.
create policy "votes_insert_own"
  on public.votes for insert
  to authenticated
  with check (
    voter_id = auth.uid()
    and exists (
      select 1 from public.declarations d
      where d.id = declaration_id
        and d.status = 'open'
        and d.declared_by <> auth.uid()
    )
  );

-- Un joueur peut modifier son propre vote tant que la déclaration est ouverte.
create policy "votes_update_own"
  on public.votes for update
  to authenticated
  using (
    voter_id = auth.uid()
    and exists (
      select 1 from public.declarations d
      where d.id = declaration_id
        and d.status = 'open'
    )
  )
  with check (voter_id = auth.uid());

create policy "votes_delete_own"
  on public.votes for delete
  to authenticated
  using (
    voter_id = auth.uid()
    and exists (
      select 1 from public.declarations d
      where d.id = declaration_id
        and d.status = 'open'
    )
  );

-- Helper trigger function (générique, réutilisable).
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger votes_set_updated_at
  before update on public.votes
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Fonction: close_declaration
-- Clôture une déclaration et calcule le score du déclarant en additionnant
-- tous les points votés (known + emotion) par les autres joueurs.
-- Seul le déclarant peut clôturer sa propre déclaration.
-- ----------------------------------------------------------------------------
create function public.close_declaration(p_declaration_id uuid)
returns public.declarations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_declaration public.declarations;
  v_score integer;
begin
  select * into v_declaration
  from public.declarations
  where id = p_declaration_id
  for update;

  if v_declaration is null then
    raise exception 'Declaration not found';
  end if;

  if v_declaration.declared_by <> auth.uid() then
    raise exception 'Only the declarant can close this declaration';
  end if;

  if v_declaration.status = 'closed' then
    return v_declaration;
  end if;

  select coalesce(sum(known::int) + sum(emotion::int), 0) into v_score
  from public.votes
  where declaration_id = p_declaration_id;

  update public.declarations
  set status = 'closed',
      score_awarded = v_score,
      closed_at = now()
  where id = p_declaration_id
  returning * into v_declaration;

  return v_declaration;
end;
$$;

grant execute on function public.close_declaration(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Vue: leaderboard
-- Classement des joueurs par score total (somme des score_awarded reçus).
-- ----------------------------------------------------------------------------
create view public.leaderboard as
select
  u.id,
  u.username,
  u.avatar_url,
  coalesce(sum(d.score_awarded) filter (where d.status = 'closed'), 0) as total_score
from public.users u
left join public.declarations d on d.declared_by = u.id
group by u.id, u.username, u.avatar_url
order by total_score desc;
