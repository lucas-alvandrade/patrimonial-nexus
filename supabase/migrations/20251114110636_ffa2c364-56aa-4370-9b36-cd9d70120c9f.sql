-- Fix RLS policies for inventarios table
-- The issue is that the policy checks against usuarios table, but user might not exist there yet

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create inventories" ON inventarios;
DROP POLICY IF EXISTS "Users can update inventories they are responsible for" ON inventarios;
DROP POLICY IF EXISTS "Users can view inventories they are responsible for or complete" ON inventarios;

-- Create new policies that handle NULL usuario_responsavel
-- Allow creating inventories for authenticated users (will set usuario_responsavel later)
CREATE POLICY "Users can create inventories" 
ON inventarios 
FOR INSERT 
TO authenticated
WITH CHECK (
  usuario_responsavel IS NULL OR
  usuario_responsavel = (
    SELECT id FROM usuarios 
    WHERE ldap_id = (
      SELECT raw_user_meta_data->>'ldap_id' 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  ) OR is_admin()
);

-- Allow updating inventories they are responsible for
CREATE POLICY "Users can update inventories they are responsible for" 
ON inventarios 
FOR UPDATE 
TO authenticated
USING (
  usuario_responsavel = (
    SELECT id FROM usuarios 
    WHERE ldap_id = (
      SELECT raw_user_meta_data->>'ldap_id' 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  ) OR is_admin()
);

-- Allow viewing inventories they are responsible for or completed
CREATE POLICY "Users can view inventories they are responsible for or complete" 
ON inventarios 
FOR SELECT 
TO authenticated
USING (
  usuario_responsavel IS NULL OR
  usuario_responsavel = (
    SELECT id FROM usuarios 
    WHERE ldap_id = (
      SELECT raw_user_meta_data->>'ldap_id' 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  ) OR 
  concluido_por = (
    SELECT id FROM usuarios 
    WHERE ldap_id = (
      SELECT raw_user_meta_data->>'ldap_id' 
      FROM auth.users 
      WHERE id = auth.uid()
    )
  ) OR is_admin()
);