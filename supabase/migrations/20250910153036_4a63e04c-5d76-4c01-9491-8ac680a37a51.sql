-- Add number and complement fields to clients table
ALTER TABLE public.clients 
ADD COLUMN address_number VARCHAR(20),
ADD COLUMN address_complement VARCHAR(100);