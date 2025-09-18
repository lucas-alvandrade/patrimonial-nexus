-- Add new columns to bens table for the updated structure
ALTER TABLE public.bens 
ADD COLUMN IF NOT EXISTS carga_atual TEXT,
ADD COLUMN IF NOT EXISTS setor_responsavel TEXT,
ADD COLUMN IF NOT EXISTS valor DECIMAL(12,2) DEFAULT 0;