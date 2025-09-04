-- Security hardening migration (part 2): Handle existing triggers properly

-- 1. Drop all potentially existing triggers first
DROP TRIGGER IF EXISTS trigger_payments_set_user_id ON public.payments;
DROP TRIGGER IF EXISTS trigger_sale_items_set_user_id ON public.sale_items;
DROP TRIGGER IF EXISTS trigger_sale_items_compute_line_total ON public.sale_items;
DROP TRIGGER IF EXISTS trigger_recalc_sale_total_insert ON public.sale_items;
DROP TRIGGER IF EXISTS trigger_recalc_sale_total_update ON public.sale_items;
DROP TRIGGER IF EXISTS trigger_recalc_sale_total_delete ON public.sale_items;
DROP TRIGGER IF EXISTS trigger_affiliations_updated_at ON public.affiliations;
DROP TRIGGER IF EXISTS trigger_clients_updated_at ON public.clients;
DROP TRIGGER IF EXISTS trigger_payments_updated_at ON public.payments;
DROP TRIGGER IF EXISTS trigger_products_updated_at ON public.products;
DROP TRIGGER IF EXISTS trigger_sales_updated_at ON public.sales;
DROP TRIGGER IF EXISTS trigger_sale_items_updated_at ON public.sale_items;

-- 2. Drop existing RLS policies
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
DROP POLICY IF EXISTS "payments_update_own" ON public.payments;
DROP POLICY IF EXISTS "payments_delete_own" ON public.payments;

DROP POLICY IF EXISTS "sales_select_own" ON public.sales;
DROP POLICY IF EXISTS "sales_insert_own" ON public.sales;
DROP POLICY IF EXISTS "sales_update_own" ON public.sales;
DROP POLICY IF EXISTS "sales_delete_own" ON public.sales;

DROP POLICY IF EXISTS "sale_items_select_own" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_insert_own" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_update_own" ON public.sale_items;
DROP POLICY IF EXISTS "sale_items_delete_own" ON public.sale_items;

DROP POLICY IF EXISTS "affiliations_update_own" ON public.affiliations;
DROP POLICY IF EXISTS "clients_update_own" ON public.clients;
DROP POLICY IF EXISTS "products_update_own" ON public.products;

-- 3. Create hardened RLS policies for payments
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

-- 4. Create hardened RLS policies for sales
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

-- 5. Create hardened RLS policies for sale_items
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

-- 6. Update other table policies with explicit WITH CHECK
CREATE POLICY "affiliations_update_own" 
ON public.affiliations 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "clients_update_own" 
ON public.clients 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "products_update_own" 
ON public.products 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- 7. Create integrity triggers
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

-- 8. Create updated_at triggers
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