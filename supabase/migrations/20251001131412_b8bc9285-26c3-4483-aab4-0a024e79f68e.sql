-- Criar enum para status do inventário
CREATE TYPE status_inventario AS ENUM ('nao_iniciado', 'em_andamento', 'concluido');

-- Criar tabela para armazenar inventários
CREATE TABLE public.inventarios (
  id BIGSERIAL PRIMARY KEY,
  ambiente_id BIGINT NOT NULL REFERENCES public.ambientes(id) ON DELETE CASCADE,
  status status_inventario NOT NULL DEFAULT 'nao_iniciado',
  concluido_por BIGINT REFERENCES public.usuarios(id),
  concluido_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(ambiente_id)
);

-- Criar tabela para armazenar itens do inventário
CREATE TABLE public.inventario_itens (
  id BIGSERIAL PRIMARY KEY,
  inventario_id BIGINT NOT NULL REFERENCES public.inventarios(id) ON DELETE CASCADE,
  patrimonio TEXT NOT NULL,
  descricao TEXT NOT NULL,
  situacao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.inventarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_itens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para inventarios
CREATE POLICY "Allow full access to inventarios for authenticated users"
ON public.inventarios
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Políticas RLS para inventario_itens
CREATE POLICY "Allow full access to inventario_itens for authenticated users"
ON public.inventario_itens
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger para atualizar updated_at em inventarios
CREATE TRIGGER update_inventarios_updated_at
BEFORE UPDATE ON public.inventarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para atualizar updated_at em inventario_itens
CREATE TRIGGER update_inventario_itens_updated_at
BEFORE UPDATE ON public.inventario_itens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();