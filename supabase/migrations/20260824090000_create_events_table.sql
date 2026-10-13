create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  customer_id uuid references public.clients(id) on delete set null,
  title text not null,
  event_type text,
  status text not null default 'QUOTE',
  start_date date not null,
  end_date date,
  start_time time,
  end_time time,
  guests integer default 0,
  total_value numeric(12,2) default 0,
  signal_value numeric(12,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Allow all access to events for authenticated users" on public.events
  for all to authenticated using (true) with check (true);
