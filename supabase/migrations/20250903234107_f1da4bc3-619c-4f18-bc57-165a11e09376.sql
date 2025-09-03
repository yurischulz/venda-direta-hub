-- Enable required extension
create extension if not exists pgcrypto;

-- Function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Drop tables if they exist to recreate fresh
drop table if exists public.payments;
drop table if exists public.sale_items;
drop table if exists public.sales;
drop table if exists public.products;
drop table if exists public.clients;
drop table if exists public.affiliations;

-- Table: affiliations
create table public.affiliations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  affiliation_id uuid references public.affiliations(id) on delete set null,
  name text not null,
  phone text,
  cpf text,
  email text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: products
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  price numeric(12,2) not null default 0,
  description text,
  unit text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: sales
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  client_id uuid not null references public.clients(id) on delete restrict,
  affiliation_id uuid references public.affiliations(id) on delete set null,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: sale_items
create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity numeric(12,3) not null,
  unit_price numeric(12,2) not null,
  line_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  client_id uuid not null references public.clients(id) on delete restrict,
  amount numeric(12,2) not null,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index idx_affiliations_user on public.affiliations(user_id);
create index idx_clients_user on public.clients(user_id);
create index idx_clients_affiliation on public.clients(affiliation_id);
create index idx_products_user on public.products(user_id);
create index idx_sales_user on public.sales(user_id);
create index idx_sales_client on public.sales(client_id);
create index idx_sales_affiliation on public.sales(affiliation_id);
create index idx_sale_items_sale on public.sale_items(sale_id);
create index idx_sale_items_user on public.sale_items(user_id);
create index idx_payments_user on public.payments(user_id);
create index idx_payments_client on public.payments(client_id);

-- Triggers to maintain updated_at
create trigger trg_affiliations_updated_at
before update on public.affiliations
for each row execute function public.update_updated_at_column();

create trigger trg_clients_updated_at
before update on public.clients
for each row execute function public.update_updated_at_column();

create trigger trg_products_updated_at
before update on public.products
for each row execute function public.update_updated_at_column();

create trigger trg_sales_updated_at
before update on public.sales
for each row execute function public.update_updated_at_column();

create trigger trg_sale_items_updated_at
before update on public.sale_items
for each row execute function public.update_updated_at_column();

create trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.update_updated_at_column();

-- Trigger to compute line_total for sale_items
create or replace function public.sale_items_compute_line_total()
returns trigger as $$
begin
  new.line_total = coalesce(new.quantity,0) * coalesce(new.unit_price,0);
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger trg_sale_items_compute_line_total
before insert or update of quantity, unit_price on public.sale_items
for each row execute function public.sale_items_compute_line_total();

-- Trigger to ensure sale_items.user_id matches sale.user_id
create or replace function public.sale_items_set_user_id()
returns trigger as $$
begin
  select s.user_id into new.user_id from public.sales s where s.id = new.sale_id;
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger trg_sale_items_set_user_id
before insert or update of sale_id on public.sale_items
for each row execute function public.sale_items_set_user_id();

-- Trigger to ensure payments.user_id matches clients.user_id
create or replace function public.payments_set_user_id()
returns trigger as $$
begin
  select c.user_id into new.user_id from public.clients c where c.id = new.client_id;
  return new;
end;
$$ language plpgsql set search_path = public;

create trigger trg_payments_set_user_id
before insert or update of client_id on public.payments
for each row execute function public.payments_set_user_id();

-- Trigger to recalc sales.total when sale_items change
create or replace function public.recalc_sale_total()
returns trigger as $$
declare
  v_sale_id uuid;
begin
  v_sale_id := coalesce(new.sale_id, old.sale_id);
  update public.sales s
     set total = coalesce((select sum(si.line_total) from public.sale_items si where si.sale_id = v_sale_id), 0)
   where s.id = v_sale_id;
  return null;
end;
$$ language plpgsql set search_path = public;

create trigger trg_sale_items_recalc_total
after insert or update or delete on public.sale_items
for each row execute function public.recalc_sale_total();

-- Enable Row Level Security
alter table public.affiliations enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;

-- Policies: each user can manage only their own rows
-- Affiliations
create policy "affiliations_select_own"
  on public.affiliations for select
  to authenticated using (user_id = auth.uid());
create policy "affiliations_insert_own"
  on public.affiliations for insert
  to authenticated with check (user_id = auth.uid());
create policy "affiliations_update_own"
  on public.affiliations for update
  to authenticated using (user_id = auth.uid());
create policy "affiliations_delete_own"
  on public.affiliations for delete
  to authenticated using (user_id = auth.uid());

-- Clients
create policy "clients_select_own"
  on public.clients for select
  to authenticated using (user_id = auth.uid());
create policy "clients_insert_own"
  on public.clients for insert
  to authenticated with check (user_id = auth.uid());
create policy "clients_update_own"
  on public.clients for update
  to authenticated using (user_id = auth.uid());
create policy "clients_delete_own"
  on public.clients for delete
  to authenticated using (user_id = auth.uid());

-- Products
create policy "products_select_own"
  on public.products for select
  to authenticated using (user_id = auth.uid());
create policy "products_insert_own"
  on public.products for insert
  to authenticated with check (user_id = auth.uid());
create policy "products_update_own"
  on public.products for update
  to authenticated using (user_id = auth.uid());
create policy "products_delete_own"
  on public.products for delete
  to authenticated using (user_id = auth.uid());

-- Sales
create policy "sales_select_own"
  on public.sales for select
  to authenticated using (user_id = auth.uid());
create policy "sales_insert_own"
  on public.sales for insert
  to authenticated with check (user_id = auth.uid());
create policy "sales_update_own"
  on public.sales for update
  to authenticated using (user_id = auth.uid());
create policy "sales_delete_own"
  on public.sales for delete
  to authenticated using (user_id = auth.uid());

-- Sale Items
create policy "sale_items_select_own"
  on public.sale_items for select
  to authenticated using (user_id = auth.uid());
create policy "sale_items_insert_own"
  on public.sale_items for insert
  to authenticated with check (user_id = auth.uid());
create policy "sale_items_update_own"
  on public.sale_items for update
  to authenticated using (user_id = auth.uid());
create policy "sale_items_delete_own"
  on public.sale_items for delete
  to authenticated using (user_id = auth.uid());

-- Payments
create policy "payments_select_own"
  on public.payments for select
  to authenticated using (user_id = auth.uid());
create policy "payments_insert_own"
  on public.payments for insert
  to authenticated with check (user_id = auth.uid());
create policy "payments_update_own"
  on public.payments for update
  to authenticated using (user_id = auth.uid());
create policy "payments_delete_own"
  on public.payments for delete
  to authenticated using (user_id = auth.uid());