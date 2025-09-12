-- Create tables based on the schema provided
CREATE TABLE public.patrimonio (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  numero_patrimonio TEXT NOT NULL UNIQUE,
  descricao TEXT,
  localizacao TEXT NOT NULL,
  condicao TEXT CHECK (condicao IN ('bom', 'inservível')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.ambientes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.usuarios (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  ldap_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.bens (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  numero_patrimonio TEXT NOT NULL UNIQUE,
  descricao TEXT,
  condicao TEXT CHECK (condicao IN ('bom', 'inservível')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.ambiente_bens (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ambiente_id BIGINT REFERENCES public.ambientes (id) ON DELETE CASCADE,
  bem_id BIGINT REFERENCES public.bens (id) ON DELETE CASCADE,
  usuario_id BIGINT REFERENCES public.usuarios (id) ON DELETE CASCADE,
  data_registro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.patrimonio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambiente_bens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (for now, allow all authenticated users)
CREATE POLICY "Allow full access to patrimonio for authenticated users" 
ON public.patrimonio 
FOR ALL 
USING (true);

CREATE POLICY "Allow full access to ambientes for authenticated users" 
ON public.ambientes 
FOR ALL 
USING (true);

CREATE POLICY "Allow full access to usuarios for authenticated users" 
ON public.usuarios 
FOR ALL 
USING (true);

CREATE POLICY "Allow full access to bens for authenticated users" 
ON public.bens 
FOR ALL 
USING (true);

CREATE POLICY "Allow full access to ambiente_bens for authenticated users" 
ON public.ambiente_bens 
FOR ALL 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_patrimonio_updated_at
  BEFORE UPDATE ON public.patrimonio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ambientes_updated_at
  BEFORE UPDATE ON public.ambientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bens_updated_at
  BEFORE UPDATE ON public.bens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ambiente_bens_updated_at
  BEFORE UPDATE ON public.ambiente_bens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', false);

-- Create storage policies
CREATE POLICY "Allow authenticated users to upload files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to view uploaded files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'uploads' AND auth.uid() IS NOT NULL);