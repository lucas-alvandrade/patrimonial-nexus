-- Adicionar coluna inventariante à tabela inventario_itens
ALTER TABLE public.inventario_itens 
ADD COLUMN inventariante text;