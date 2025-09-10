-- Add CEP field to clients table
ALTER TABLE public.clients 
ADD COLUMN cep VARCHAR(10);