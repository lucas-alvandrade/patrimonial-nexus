-- Adicionar coluna tipo_cadastro para indicar se o item foi cadastrado automaticamente (A) ou manualmente (M)
ALTER TABLE public.inventario_itens 
ADD COLUMN IF NOT EXISTS tipo_cadastro text DEFAULT 'M';

-- Comentário explicativo
COMMENT ON COLUMN public.inventario_itens.tipo_cadastro IS 'Tipo de cadastro: A = Automático (bem existe na tabela bens), M = Manual (bem não existe ou patrimônio vazio)';