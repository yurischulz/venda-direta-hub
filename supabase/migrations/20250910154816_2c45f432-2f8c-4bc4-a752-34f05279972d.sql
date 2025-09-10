-- Add address fields to affiliations table
ALTER TABLE public.affiliations 
ADD COLUMN cep VARCHAR(10),
ADD COLUMN address TEXT,
ADD COLUMN address_number VARCHAR(20),
ADD COLUMN address_complement VARCHAR(100),
ADD COLUMN latitude NUMERIC,
ADD COLUMN longitude NUMERIC;