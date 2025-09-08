-- Add latitude and longitude columns to clients table
ALTER TABLE public.clients 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);

-- Add latitude and longitude columns to sales table for location tracking
ALTER TABLE public.sales 
ADD COLUMN latitude DECIMAL(10, 8),
ADD COLUMN longitude DECIMAL(11, 8);