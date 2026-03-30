-- Run this in your Supabase SQL editor

create table borrowers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text,
  created_at timestamptz default now()
);

create table loans (
  id uuid primary key default gen_random_uuid(),
  borrower_id uuid references borrowers(id) on delete cascade not null,
  item_name text not null,
  total_price numeric,
  monthly_amount numeric not null,
  months integer not null,
  start_date date not null,
  created_at timestamptz default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid references loans(id) on delete cascade not null,
  month_number integer not null,
  payment_date date not null,
  receipt_url text,
  notes text,
  created_at timestamptz default now(),
  unique(loan_id, month_number)
);

-- Enable Row Level Security (open access since no auth)
alter table borrowers enable row level security;
alter table loans enable row level security;
alter table payments enable row level security;

create policy "allow all" on borrowers for all using (true) with check (true);
create policy "allow all" on loans for all using (true) with check (true);
create policy "allow all" on payments for all using (true) with check (true);
