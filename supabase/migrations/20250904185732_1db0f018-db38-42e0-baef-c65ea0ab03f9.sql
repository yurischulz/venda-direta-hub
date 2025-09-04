-- Security hardening migration: Fix cross-tenant data integrity and add proper triggers

-- 1. Drop existing RLS policies that only check user_id
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
DROP POLICY IF EXISTS "payments_update_own" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_own" ON public.payments;

-- 2. Create hardened RLS policies for payments that check relational ownership
CREATE POLICY "payments_select_own" 
ON public.payments 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "payments_insert_own" 
ON public.payments 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.clients c WHERE c.id = payments.client_id AND c.user_id = auth.uid())
);

CREATE POLICY "payments_update_own" 
ON public.payments 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.clients c WHERE c.id = payments.client_id AND c.user_id = auth.uid())
);

CREATE POLICY "payments_delete_own" 
ON public.payments 
FOR DELETE 
USING (user_id = auth.uid());

-- 3. Drop and recreate sales policies with relational checks
DROP POLICY IF EXISTS "sales_select_own" ON public.sales;
DROP POLICY IF EXISTS "sales_insert_own" ON public.sales;
DROP POLICY IF EXISTS "sales_update_own" ON public.sales;
DROP POLICY IF EXISTS "sales_delete_own" ON public.sales;

CREATE POLICY "sales_select_own" 
ON public.sales 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "sales_insert_own" 
ON public.sales 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.clients c WHERE c.id = sales.client_id AND c.user_id = auth.uid()) AND
  (affiliation_id IS NULL OR EXISTS (SELECT 1 FROM public.affiliations a WHERE a.id = sales.affiliation_id AND a.user_id = auth.uid()))
);

CREATE POLICY "sales_update_own" 
ON public.sales 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.clients c WHERE c.id = sales.client_id AND c.user_id = auth.uid()) AND
  (affiliation_id IS NULL OR EXISTS (SELECT 1 FROM public.affiliations a WHERE a.id = sales.affiliation_id AND a.user_id = auth.uid()))
);

CREATE POLICY "sales_delete_own" 
ON public.sales 
FOR DELETE 
USING (user_id = auth.uid());

-- 4. Drop and recreate sale_items policies with relational checks
DROP POLICY IF EXISTS "sale_items_select_own" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_insert_own" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_update_own" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_delete_own" ON public.sale_items;

CREATE POLICY "sale_items_select_own" 
ON public.sale_items 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "sale_items_insert_own" 
ON public.sale_items 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_items.sale_id AND s.user_id = auth.uid()) AND
  (product_id IS NULL OR EXISTS (SELECT 1 FROM public.products p WHERE p.id = sale_items.product_id AND p.user_id = auth.uid()))
);

CREATE POLICY "sale_items_update_own" 
ON public.sale_items 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (
  user_id = auth.uid() AND 
  EXISTS (SELECT 1 FROM public.sales s WHERE s.id = sale_items.sale_id AND s.user_id = auth.uid()) AND
  (product_id IS NULL OR EXISTS (SELECT 1 FROM public.products p WHERE p.id = sale_items.product_id AND p.user_id = auth.uid()))
);

CREATE POLICY "sale_items_delete_own" 
ON public.sale_items 
FOR DELETE 
USING (user_id = auth.uid());

-- 5. Add explicit WITH CHECK clauses to existing policies for other tables
DROP POLICY IF EXISTS "affiliations_update_own" ON public.affiliations;
CREATE POLICY "affiliations_update_own" 
ON public.affiliations 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "clients_update_own" ON public.clients;
CREATE POLICY "clients_update_own" 
ON public.clients 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "products_update_own" ON public.products;
CREATE POLICY "products_update_own" 
ON public.products 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- 6. Attach integrity triggers using existing functions
CREATE TRIGGER trigger_payments_set_user_id
  BEFORE INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.payments_set_user_id();

CREATE TRIGGER trigger_sale_items_set_user_id
  BEFORE INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.sale_items_set_user_id();

CREATE TRIGGER trigger_sale_items_compute_line_total
  BEFORE INSERT OR UPDATE ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.sale_items_compute_line_total();

CREATE TRIGGER trigger_recalc_sale_total_insert
  AFTER INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.recalc_sale_total();

CREATE TRIGGER trigger_recalc_sale_total_update
  AFTER UPDATE ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.recalc_sale_total();

CREATE TRIGGER trigger_recalc_sale_total_delete
  AFTER DELETE ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.recalc_sale_total();

-- 7. Add updated_at triggers for all tables
CREATE TRIGGER trigger_affiliations_updated_at
  BEFORE UPDATE ON public.affiliations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_sale_items_updated_at
  BEFORE UPDATE ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Add data validation constraints
ALTER TABLE public.payments ADD CONSTRAINT check_payments_amount_positive CHECK (amount > 0);
ALTER TABLE public.products ADD CONSTRAINT check_products_price_non_negative CHECK (price >= 0);
ALTER TABLE public.sale_items ADD CONSTRAINT check_sale_items_quantity_non_negative CHECK (quantity >= 0);
ALTER TABLE public.sale_items ADD CONSTRAINT check_sale_items_unit_price_non_negative CHECK (unit_price >= 0);