-- Add usuario_responsavel to inventarios table to track who is working on each inventory
ALTER TABLE public.inventarios 
ADD COLUMN usuario_responsavel bigint REFERENCES public.usuarios(id);

-- Add index for better query performance
CREATE INDEX idx_inventarios_usuario_responsavel ON public.inventarios(usuario_responsavel);

-- Add comment for documentation
COMMENT ON COLUMN public.inventarios.usuario_responsavel IS 'Usuario responsável pelo inventário (quem está inventariando ou inventariou)';