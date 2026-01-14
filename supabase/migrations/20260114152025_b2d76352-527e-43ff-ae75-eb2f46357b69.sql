-- Adicionar coluna duplicado à tabela inventario_itens
ALTER TABLE public.inventario_itens 
ADD COLUMN IF NOT EXISTS duplicado text DEFAULT 'Não';