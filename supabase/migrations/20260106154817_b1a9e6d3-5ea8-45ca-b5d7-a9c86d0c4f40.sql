-- Criar tabela de grupos
CREATE TABLE public.grupos (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela de relacionamento grupos_usuarios
CREATE TABLE public.grupos_usuarios (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  grupo_id bigint NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  usuario_id bigint NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(grupo_id, usuario_id)
);

-- Habilitar RLS
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos_usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para grupos
CREATE POLICY "Allow full access to grupos for authenticated users"
ON public.grupos
FOR ALL
USING (true)
WITH CHECK (true);

-- Políticas RLS para grupos_usuarios
CREATE POLICY "Allow full access to grupos_usuarios for authenticated users"
ON public.grupos_usuarios
FOR ALL
USING (true)
WITH CHECK (true);

-- Trigger para updated_at na tabela grupos
CREATE TRIGGER update_grupos_updated_at
BEFORE UPDATE ON public.grupos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();