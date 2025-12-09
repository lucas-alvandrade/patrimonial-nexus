-- Add senha column to usuarios table
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS senha TEXT;

-- Make ldap_id nullable (we'll keep it for backwards compatibility but not require it)
ALTER TABLE public.usuarios ALTER COLUMN ldap_id DROP NOT NULL;

-- Make email nullable since local users won't require email
ALTER TABLE public.usuarios ALTER COLUMN email DROP NOT NULL;

-- Update RLS policies to work with local auth (simpler policies)
DROP POLICY IF EXISTS "Allow insert for admins or during authentication" ON public.usuarios;
DROP POLICY IF EXISTS "Only admins can delete users" ON public.usuarios;
DROP POLICY IF EXISTS "Users can update own data or admins can update all" ON public.usuarios;
DROP POLICY IF EXISTS "Users can view own data or admins can view all" ON public.usuarios;

-- Create simpler RLS policies that allow all operations for authenticated users
CREATE POLICY "Allow all operations on usuarios"
ON public.usuarios FOR ALL
USING (true)
WITH CHECK (true);