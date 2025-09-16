-- Reset all tables and recreate from scratch
-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS public.ambiente_bens CASCADE;
DROP TABLE IF EXISTS public.bens CASCADE;
DROP TABLE IF EXISTS public.ambientes CASCADE;
DROP TABLE IF EXISTS public.patrimonio CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Drop existing enum if it exists
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Create usuarios table
CREATE TABLE public.usuarios (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  ldap_id TEXT NOT NULL UNIQUE,
  role public.user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patrimonio table
CREATE TABLE public.patrimonio (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  numero_patrimonio TEXT NOT NULL UNIQUE,
  descricao TEXT,
  localizacao TEXT NOT NULL,
  condicao TEXT CHECK (condicao IN ('bom', 'inservível')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bens table
CREATE TABLE public.bens (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  numero_patrimonio TEXT NOT NULL UNIQUE,
  descricao TEXT,
  condicao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ambientes table
CREATE TABLE public.ambientes (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  nome TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ambiente_bens junction table
CREATE TABLE public.ambiente_bens (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ambiente_id BIGINT,
  bem_id BIGINT,
  usuario_id BIGINT,
  data_registro TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_usuarios_updated_at
  BEFORE UPDATE ON public.usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patrimonio_updated_at
  BEFORE UPDATE ON public.patrimonio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bens_updated_at
  BEFORE UPDATE ON public.bens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ambientes_updated_at
  BEFORE UPDATE ON public.ambientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ambiente_bens_updated_at
  BEFORE UPDATE ON public.ambiente_bens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create database functions for user role management
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.usuarios WHERE ldap_id = (
    SELECT raw_user_meta_data->>'ldap_id' 
    FROM auth.users 
    WHERE id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_current_user_role() = 'admin'::public.user_role;
$$;

-- Enable Row Level Security on all tables
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrimonio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ambiente_bens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for usuarios table
CREATE POLICY "Users can view own data or admins can view all"
  ON public.usuarios
  FOR SELECT
  USING (
    ldap_id = (
      SELECT raw_user_meta_data->>'ldap_id'
      FROM auth.users
      WHERE id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Users can update own data or admins can update all"
  ON public.usuarios
  FOR UPDATE
  USING (
    ldap_id = (
      SELECT raw_user_meta_data->>'ldap_id'
      FROM auth.users
      WHERE id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Allow insert for admins or during authentication"
  ON public.usuarios
  FOR INSERT
  WITH CHECK (
    is_admin() OR ldap_id = (
      SELECT raw_user_meta_data->>'ldap_id'
      FROM auth.users
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Only admins can delete users"
  ON public.usuarios
  FOR DELETE
  USING (is_admin());

-- Create RLS policies for asset tables (temporary broad access - to be refined later)
CREATE POLICY "Allow full access to patrimonio for authenticated users"
  ON public.patrimonio
  FOR ALL
  USING (true);

CREATE POLICY "Allow full access to bens for authenticated users"
  ON public.bens
  FOR ALL
  USING (true);

CREATE POLICY "Allow full access to ambientes for authenticated users"
  ON public.ambientes
  FOR ALL
  USING (true);

CREATE POLICY "Allow full access to ambiente_bens for authenticated users"
  ON public.ambiente_bens
  FOR ALL
  USING (true);