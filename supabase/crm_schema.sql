-- Enable required extensions
create extension if not exists "pgcrypto";

-- Safely create types
do $$ begin
    create type contact_origin as enum ('WHATSAPP', 'CAKTO', 'MANUAL', 'WEB_FORM', 'INDICATION');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type contact_status as enum ('LEAD', 'CLIENT', 'FORMER_CLIENT', 'ARCHIVED');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type deal_status as enum ('ATIVO', 'GANHO', 'PERDIDO');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type message_sender_type as enum ('WHATSAPP_INCOMING', 'WHATSAPP_OUTGOING', 'SYSTEM');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type group_type as enum ('AULA', 'SUPORTE', 'COMUNIDADE');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type group_status as enum ('ACTIVE', 'ARCHIVED');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type webhook_type as enum ('CAKTO', 'WHATSAPP');
exception
    when duplicate_object then null;
end $$;

do $$ begin
    create type webhook_status as enum ('RECEIVED', 'PROCESSED', 'FAILED');
exception
    when duplicate_object then null;
end $$;

-- CRM Tables

-- 1. Contacts
create table if not exists crm_contacts (
  id uuid default gen_random_uuid() primary key,
  name text,
  email text,
  whatsapp text,
  photo_url text,
  origin contact_origin default 'MANUAL',
  status contact_status default 'LEAD',
  responsible_user_id uuid references auth.users(id),
  tags jsonb default '[]'::jsonb,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. Pipelines
create table if not exists crm_pipelines (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 3. Stages
create table if not exists crm_stages (
  id uuid default gen_random_uuid() primary key,
  pipeline_id uuid references crm_pipelines(id) on delete cascade,
  name text not null,
  "order" integer not null,
  color text default '#e2e8f0',
  created_at timestamp with time zone default now()
);

-- 4. Deals
create table if not exists crm_deals (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references crm_contacts(id) on delete cascade,
  pipeline_id uuid references crm_pipelines(id) on delete restrict,
  stage_id uuid references crm_stages(id) on delete restrict,
  responsible_user_id uuid references public.profiles(id),
  value numeric(10, 2) default 0,
  expected_close_date date,
  cakto_order_id text,
  cakto_product_id text,
  status deal_status default 'ATIVO',
  loss_reason text,
  last_message_preview text,
  last_message_at timestamp with time zone,
  moved_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. Deal History
create table if not exists crm_deal_history (
  id uuid default gen_random_uuid() primary key,
  deal_id uuid references crm_deals(id) on delete cascade,
  from_stage_id uuid references crm_stages(id),
  to_stage_id uuid references crm_stages(id),
  moved_by_user_id uuid references auth.users(id),
  moved_at timestamp with time zone default now(),
  reason text
);

-- 6. Messages
create table if not exists crm_messages (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references crm_contacts(id) on delete cascade,
  deal_id uuid references crm_deals(id) on delete set null,
  sender_type message_sender_type not null,
  sender_id uuid references auth.users(id),
  message_text text not null,
  message_id_whatsapp text,
  created_at timestamp with time zone default now()
);

-- 7. Groups
create table if not exists crm_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type group_type default 'AULA',
  responsible_user_id uuid references public.profiles(id),
  status group_status default 'ACTIVE',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 8. Group Members
create table if not exists crm_group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references crm_groups(id) on delete cascade,
  contact_id uuid references crm_contacts(id) on delete cascade,
  joined_at timestamp with time zone default now(),
  removed_at timestamp with time zone
);

-- 9. Config
create table if not exists crm_config (
  id uuid default gen_random_uuid() primary key,
  key text unique not null,
  value text, 
  description text,
  is_active boolean default true,
  updated_by_user_id uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 10. Webhooks Log
create table if not exists crm_webhooks_log (
  id uuid default gen_random_uuid() primary key,
  webhook_type webhook_type not null,
  event_type text,
  payload jsonb,
  status webhook_status default 'RECEIVED',
  error_message text,
  processed_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- RLS Policies
alter table crm_contacts enable row level security;
alter table crm_deals enable row level security;
alter table crm_groups enable row level security;
alter table crm_config enable row level security;
alter table crm_pipelines enable row level security;
alter table crm_stages enable row level security;
alter table crm_messages enable row level security;
alter table crm_deal_history enable row level security;
alter table crm_group_members enable row level security;
alter table crm_webhooks_log enable row level security;

-- Admin policies (Drop if exists to avoid errors on re-run)
drop policy if exists "Enable all access for authenticated users" on crm_contacts;
create policy "Enable all access for authenticated users" on crm_contacts for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all access for authenticated users" on crm_deals;
create policy "Enable all access for authenticated users" on crm_deals for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all access for authenticated users" on crm_groups;
create policy "Enable all access for authenticated users" on crm_groups for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all access for authenticated users" on crm_config;
create policy "Enable all access for authenticated users" on crm_config for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all access for authenticated users" on crm_pipelines;
create policy "Enable all access for authenticated users" on crm_pipelines for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all access for authenticated users" on crm_stages;
create policy "Enable all access for authenticated users" on crm_stages for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all access for authenticated users" on crm_messages;
create policy "Enable all access for authenticated users" on crm_messages for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all access for authenticated users" on crm_deal_history;
create policy "Enable all access for authenticated users" on crm_deal_history for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all access for authenticated users" on crm_group_members;
create policy "Enable all access for authenticated users" on crm_group_members for all using (auth.role() = 'authenticated');

drop policy if exists "Enable all access for authenticated users" on crm_webhooks_log;
create policy "Enable all access for authenticated users" on crm_webhooks_log for all using (auth.role() = 'authenticated');

-- Insert Default Pipelines (Idempotent)
insert into crm_pipelines (name, description)
select 'Vendas Consultivas', 'Funil padrão para vendas de cursos'
where not exists (select 1 from crm_pipelines where name = 'Vendas Consultivas');

insert into crm_pipelines (name, description)
select 'Suporte Idiomas', 'Atendimento aos alunos de idiomas'
where not exists (select 1 from crm_pipelines where name = 'Suporte Idiomas');

insert into crm_pipelines (name, description)
select 'Suporte Profs', 'Atendimento e suporte aos professores'
where not exists (select 1 from crm_pipelines where name = 'Suporte Profs');

-- Insert Stages for Vendas Consultivas
do $$
declare
  p_id uuid;
begin
  select id into p_id from crm_pipelines where name = 'Vendas Consultivas';
  if p_id is not null and not exists (select 1 from crm_stages where pipeline_id = p_id) then
    insert into crm_stages (pipeline_id, name, "order", color) values
      (p_id, 'Lead Recebido', 1, '#94a3b8'),
      (p_id, 'Qualificação Inicial', 2, '#64748b'),
      (p_id, 'Diagnóstico/Briefing', 3, '#3b82f6'),
      (p_id, 'Apresentação das Aulas', 4, '#8b5cf6'),
      (p_id, 'Negociação', 5, '#eab308'),
      (p_id, 'Follow-up/Decisão', 6, '#f97316'),
      (p_id, 'Ganhamos', 7, '#22c55e'),
      (p_id, 'Perdemos', 8, '#ef4444');
  end if;
end $$;

-- Insert Stages for Suporte Idiomas
do $$
declare
  p_id uuid;
begin
  select id into p_id from crm_pipelines where name = 'Suporte Idiomas';
  if p_id is not null and not exists (select 1 from crm_stages where pipeline_id = p_id) then
    insert into crm_stages (pipeline_id, name, "order", color) values
      (p_id, 'Ticket Aberto', 1, '#ef4444'),
      (p_id, 'Em Atendimento', 2, '#f59e0b'),
      (p_id, 'Aguardando Aluno', 3, '#3b82f6'),
      (p_id, 'Resolvido', 4, '#22c55e'),
      (p_id, 'Encerrado', 5, '#94a3b8');
  end if;
end $$;

-- Insert Stages for Suporte Profs
do $$
declare
  p_id uuid;
begin
  select id into p_id from crm_pipelines where name = 'Suporte Profs';
  if p_id is not null and not exists (select 1 from crm_stages where pipeline_id = p_id) then
    insert into crm_stages (pipeline_id, name, "order", color) values
      (p_id, 'Ticket Aberto', 1, '#ef4444'),
      (p_id, 'Em Atendimento', 2, '#f59e0b'),
      (p_id, 'Aguardando Professor', 3, '#8b5cf6'),
      (p_id, 'Resolvido', 4, '#22c55e'),
      (p_id, 'Encerrado', 5, '#94a3b8');
  end if;
end $$;