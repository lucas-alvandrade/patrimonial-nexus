-- Fix security vulnerability in usuarios table (syntax corrected)
-- Add role-based access control and implement proper RLS policies

-- Step 1: Create role enum (check if exists first)
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add role column to usuarios table with proper type
DO $$ BEGIN
    ALTER TABLE public.usuarios ADD COLUMN role public.user_role NOT NULL DEFAULT 'user'::public.user_role;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Step 3: Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.usuarios WHERE ldap_id = (
    SELECT raw_user_meta_data->>'ldap_id' 
    FROM auth.users 
    WHERE id = auth.uid()
  );
$$;

-- Step 4: Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT public.get_current_user_role() = 'admin'::public.user_role;
$$;

-- Step 5: Drop existing overly permissive policy
DROP POLICY IF EXISTS "Allow full access to usuarios for authenticated users" ON public.usuarios;

-- Step 6: Create restrictive RLS policies
-- Users can only view their own data OR admins can view all data
CREATE POLICY "Users can view own data or admins can view all"
ON public.usuarios
FOR SELECT
TO authenticated
USING (
  ldap_id = (SELECT raw_user_meta_data->>'ldap_id' FROM auth.users WHERE id = auth.uid())
  OR
  public.is_admin()
);

-- Users can only update their own data OR admins can update any data
CREATE POLICY "Users can update own data or admins can update all"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  ldap_id = (SELECT raw_user_meta_data->>'ldap_id' FROM auth.users WHERE id = auth.uid())
  OR
  public.is_admin()
);

-- Only admins can insert new users
CREATE POLICY "Only admins can insert users"
ON public.usuarios
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin()
);

-- Only admins can delete users
CREATE POLICY "Only admins can delete users"
ON public.usuarios
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Step 7: Set the first user as admin (if no admin exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE role = 'admin'::public.user_role) 
     AND EXISTS (SELECT 1 FROM public.usuarios) THEN
    UPDATE public.usuarios 
    SET role = 'admin'::public.user_role
    WHERE id = (SELECT MIN(id) FROM public.usuarios);
  END IF;
END $$;