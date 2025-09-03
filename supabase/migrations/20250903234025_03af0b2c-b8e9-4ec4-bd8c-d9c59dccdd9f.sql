-- Ensure RLS is enabled (idempotent)
alter table public.affiliations enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;

-- Recreate policies without IF NOT EXISTS (safe idempotency via DROP)
-- Affiliations
drop policy if exists "affiliations_select_own" on public.affiliations;
drop policy if exists "affiliations_insert_own" on public.affiliations;
drop policy if exists "affiliations_update_own" on public.affiliations;
drop policy if exists "affiliations_delete_own" on public.affiliations;

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
drop policy if exists "clients_select_own" on public.clients;
drop policy if exists "clients_insert_own" on public.clients;
drop policy if exists "clients_update_own" on public.clients;
drop policy if exists "clients_delete_own" on public.clients;

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
drop policy if exists "products_select_own" on public.products;
drop policy if exists "products_insert_own" on public.products;
drop policy if exists "products_update_own" on public.products;
drop policy if exists "products_delete_own" on public.products;

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
drop policy if exists "sales_select_own" on public.sales;
drop policy if exists "sales_insert_own" on public.sales;
drop policy if exists "sales_update_own" on public.sales;
drop policy if exists "sales_delete_own" on public.sales;

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
drop policy if exists "sale_items_select_own" on public.sale_items;
drop policy if exists "sale_items_insert_own" on public.sale_items;
drop policy if exists "sale_items_update_own" on public.sale_items;
drop policy if exists "sale_items_delete_own" on public.sale_items;

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
drop policy if exists "payments_select_own" on public.payments;
drop policy if exists "payments_insert_own" on public.payments;
drop policy if exists "payments_update_own" on public.payments;
drop policy if exists "payments_delete_own" on public.payments;

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

-- View for client balances
create or replace view public.v_client_balances as
select
  c.id as client_id,
  c.user_id,
  c.name,
  coalesce(s.sum_total, 0)::numeric(12,2) as sales_total,
  coalesce(p.sum_amount, 0)::numeric(12,2) as payments_total,
  (coalesce(s.sum_total,0) - coalesce(p.sum_amount,0))::numeric(12,2) as balance
from public.clients c
left join (
  select client_id, user_id, sum(total) as sum_total
  from public.sales
  group by client_id, user_id
) s on s.client_id = c.id and s.user_id = c.user_id
left join (
  select client_id, user_id, sum(amount) as sum_amount
  from public.payments
  group by client_id, user_id
) p on p.client_id = c.id and p.user_id = c.user_id;

-- Realtime configuration
alter table public.affiliations replica identity full;
alter table public.clients replica identity full;
alter table public.products replica identity full;
alter table public.sales replica identity full;
alter table public.sale_items replica identity full;
alter table public.payments replica identity full;

alter publication supabase_realtime add table
  public.affiliations,
  public.clients,
  public.products,
  public.sales,
  public.sale_items,
  public.payments;
