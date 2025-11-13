-- Enable RLS on inventarios table
ALTER TABLE public.inventarios ENABLE ROW LEVEL SECURITY;

-- Enable RLS on inventario_itens table
ALTER TABLE public.inventario_itens ENABLE ROW LEVEL SECURITY;

-- Policies for inventarios table
CREATE POLICY "Users can view inventories they are responsible for or completed"
ON public.inventarios
FOR SELECT
TO authenticated
USING (
  usuario_responsavel = (
    SELECT id FROM public.usuarios 
    WHERE ldap_id = (
      SELECT raw_user_meta_data->>'ldap_id' 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
  OR concluido_por = (
    SELECT id FROM public.usuarios 
    WHERE ldap_id = (
      SELECT raw_user_meta_data->>'ldap_id' 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
  OR is_admin()
);

CREATE POLICY "Users can create inventories"
ON public.inventarios
FOR INSERT
TO authenticated
WITH CHECK (
  usuario_responsavel = (
    SELECT id FROM public.usuarios 
    WHERE ldap_id = (
      SELECT raw_user_meta_data->>'ldap_id' 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
  OR is_admin()
);

CREATE POLICY "Users can update inventories they are responsible for"
ON public.inventarios
FOR UPDATE
TO authenticated
USING (
  usuario_responsavel = (
    SELECT id FROM public.usuarios 
    WHERE ldap_id = (
      SELECT raw_user_meta_data->>'ldap_id' 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  )
  OR is_admin()
);

-- Policies for inventario_itens table
CREATE POLICY "Users can view items from their inventories"
ON public.inventario_itens
FOR SELECT
TO authenticated
USING (
  inventario_id IN (
    SELECT id FROM public.inventarios
    WHERE usuario_responsavel = (
      SELECT id FROM public.usuarios 
      WHERE ldap_id = (
        SELECT raw_user_meta_data->>'ldap_id' 
        FROM auth.users 
        WHERE id = auth.uid()
      )
    )
    OR concluido_por = (
      SELECT id FROM public.usuarios 
      WHERE ldap_id = (
        SELECT raw_user_meta_data->>'ldap_id' 
        FROM auth.users 
        WHERE id = auth.uid()
      )
    )
  )
  OR is_admin()
);

CREATE POLICY "Users can insert items into their inventories"
ON public.inventario_itens
FOR INSERT
TO authenticated
WITH CHECK (
  inventario_id IN (
    SELECT id FROM public.inventarios
    WHERE usuario_responsavel = (
      SELECT id FROM public.usuarios 
      WHERE ldap_id = (
        SELECT raw_user_meta_data->>'ldap_id' 
        FROM auth.users 
        WHERE id = auth.uid()
      )
    )
  )
  OR is_admin()
);

CREATE POLICY "Users can update items in their inventories"
ON public.inventario_itens
FOR UPDATE
TO authenticated
USING (
  inventario_id IN (
    SELECT id FROM public.inventarios
    WHERE usuario_responsavel = (
      SELECT id FROM public.usuarios 
      WHERE ldap_id = (
        SELECT raw_user_meta_data->>'ldap_id' 
        FROM auth.users 
        WHERE id = auth.uid()
      )
    )
  )
  OR is_admin()
);