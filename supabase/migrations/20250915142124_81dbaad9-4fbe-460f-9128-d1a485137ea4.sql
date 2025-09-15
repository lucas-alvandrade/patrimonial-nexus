-- Create a special policy for LDAP authentication
-- Allow upsert during authentication process

-- Drop the restrictive insert policy temporarily
DROP POLICY IF EXISTS "Only admins can insert users" ON public.usuarios;

-- Create a more flexible policy that allows insert during authentication
-- This allows both admins and the authentication process to insert users
CREATE POLICY "Allow insert for admins or during authentication"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin can always insert
  public.is_admin()
  OR
  -- During authentication, allow insert if the ldap_id matches the authenticated user
  (
    ldap_id = (SELECT raw_user_meta_data->>'ldap_id' FROM auth.users WHERE id = auth.uid())
  )
);