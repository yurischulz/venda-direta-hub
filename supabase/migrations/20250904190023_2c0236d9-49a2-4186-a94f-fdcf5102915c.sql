-- Add data validation constraints (fixed syntax)

-- Drop constraints if they exist, then add them
DO $$
BEGIN
    -- Drop existing constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_payments_amount_positive') THEN
        ALTER TABLE public.payments DROP CONSTRAINT check_payments_amount_positive;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_products_price_non_negative') THEN
        ALTER TABLE public.products DROP CONSTRAINT check_products_price_non_negative;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_sale_items_quantity_non_negative') THEN
        ALTER TABLE public.sale_items DROP CONSTRAINT check_sale_items_quantity_non_negative;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_sale_items_unit_price_non_negative') THEN
        ALTER TABLE public.sale_items DROP CONSTRAINT check_sale_items_unit_price_non_negative;
    END IF;
END $$;

-- Add the constraints
ALTER TABLE public.payments 
ADD CONSTRAINT check_payments_amount_positive 
CHECK (amount > 0);

ALTER TABLE public.products 
ADD CONSTRAINT check_products_price_non_negative 
CHECK (price >= 0);

ALTER TABLE public.sale_items 
ADD CONSTRAINT check_sale_items_quantity_non_negative 
CHECK (quantity >= 0);

ALTER TABLE public.sale_items 
ADD CONSTRAINT check_sale_items_unit_price_non_negative 
CHECK (unit_price >= 0);