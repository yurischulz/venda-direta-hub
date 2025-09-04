-- Add data validation constraints for security

-- Add constraints to ensure positive/non-negative values
ALTER TABLE public.payments 
ADD CONSTRAINT IF NOT EXISTS check_payments_amount_positive 
CHECK (amount > 0);

ALTER TABLE public.products 
ADD CONSTRAINT IF NOT EXISTS check_products_price_non_negative 
CHECK (price >= 0);

ALTER TABLE public.sale_items 
ADD CONSTRAINT IF NOT EXISTS check_sale_items_quantity_non_negative 
CHECK (quantity >= 0);

ALTER TABLE public.sale_items 
ADD CONSTRAINT IF NOT EXISTS check_sale_items_unit_price_non_negative 
CHECK (unit_price >= 0);