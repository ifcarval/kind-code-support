-- Migração para tabelas contract_templates e atualização de contracts
create table if not exists public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  version text not null default '1.0',
  original_file_name text,
  original_file_url text,
  extracted_content text,
  prepared_content text,
  fields_mapped jsonb default '{}'::jsonb,
  is_default boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table public.contract_templates enable row level security;

create policy "Allow all for master/organization on contract_templates" on public.contract_templates
  for all using (true) with check (true);

do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_name='contracts' and column_name='template_id') then
    alter table public.contracts add column template_id uuid references public.contract_templates(id);
  end if;
  if not exists (select 1 from information_schema.columns where table_name='contracts' and column_name='released') then
    alter table public.contracts add column released boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='contracts' and column_name='snapshot_variables') then
    alter table public.contracts add column snapshot_variables jsonb default '{}'::jsonb;
  end if;
end $$;
