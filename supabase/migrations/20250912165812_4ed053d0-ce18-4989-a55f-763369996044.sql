-- Fix security vulnerability in usuarios table (corrected version)
-- Add role-based access control and implement proper RLS policies

-- Step 1: Create role enum first
CREATE TYPE IF NOT EXISTS public.user_role AS ENUM ('admin', 'user');

-- Step 2: Add role column to usuarios table with proper type
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'user'::public.user_role;

-- Step 3: Create security definer function to check user roles
-- This prevents RLS recursion issues
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

-- Step 5: Create function to get current user ID from usuarios table
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM public.usuarios WHERE ldap_id = (
    SELECT raw_user_meta_data->>'ldap_id' 
    FROM auth.users 
    WHERE id = auth.uid()
  );
$$;

-- Step 6: Drop existing overly permissive policy
DROP POLICY IF EXISTS "Allow full access to usuarios for authenticated users" ON public.usuarios;

-- Step 7: Create restrictive RLS policies
-- Users can only view their own data OR admins can view all data
CREATE POLICY "Users can view own data or admins can view all"
ON public.usuarios
FOR SELECT
TO authenticated
USING (
  -- User can see their own record
  ldap_id = (SELECT raw_user_meta_data->>'ldap_id' FROM auth.users WHERE id = auth.uid())
  OR
  -- Admin can see all records
  public.is_admin()
);

-- Users can only update their own data OR admins can update any data
CREATE POLICY "Users can update own data or admins can update all"
ON public.usuarios
FOR UPDATE
TO authenticated
USING (
  -- User can update their own record
  ldap_id = (SELECT raw_user_meta_data->>'ldap_id' FROM auth.users WHERE id = auth.uid())
  OR
  -- Admin can update all records
  public.is_admin()
)
WITH CHECK (
  -- Prevent users from changing their own role to admin
  (
    ldap_id = (SELECT raw_user_meta_data->>'ldap_id' FROM auth.users WHERE id = auth.uid())
    AND (NEW.role = OLD.role OR public.is_admin())
  )
  OR
  -- Admin can change anyone's role
  public.is_admin()
);

-- Only admins can insert new users (or during LDAP authentication)
CREATE POLICY "Only admins can insert users or during auth"
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

-- Step 8: Set the first user as admin (if there are users without roles)
-- This ensures there's always at least one admin
DO $$
BEGIN
  -- Make the first user an admin if no admin exists
  IF NOT EXISTS (SELECT 1 FROM public.usuarios WHERE role = 'admin'::public.user_role) THEN
    UPDATE public.usuarios 
    SET role = 'admin'::public.user_role
    WHERE id = (SELECT MIN(id) FROM public.usuarios)
    AND EXISTS (SELECT 1 FROM public.usuarios);
  END IF;
END $$;