-- Drop existing restrictive policies on inventarios
DROP POLICY IF EXISTS "Users can create inventories" ON public.inventarios;
DROP POLICY IF EXISTS "Users can update inventories they are responsible for" ON public.inventarios;
DROP POLICY IF EXISTS "Users can view inventories they are responsible for or complete" ON public.inventarios;

-- Drop existing restrictive policies on inventario_itens
DROP POLICY IF EXISTS "Users can insert items into their inventories" ON public.inventario_itens;
DROP POLICY IF EXISTS "Users can update items in their inventories" ON public.inventario_itens;
DROP POLICY IF EXISTS "Users can view items from their inventories" ON public.inventario_itens;

-- Create PERMISSIVE policies for inventarios
CREATE POLICY "Users can view inventories"
ON public.inventarios FOR SELECT
USING (true);

CREATE POLICY "Users can create inventories"
ON public.inventarios FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update inventories"
ON public.inventarios FOR UPDATE
USING (true);

-- Create PERMISSIVE policies for inventario_itens
CREATE POLICY "Users can view inventory items"
ON public.inventario_itens FOR SELECT
USING (true);

CREATE POLICY "Users can insert inventory items"
ON public.inventario_itens FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update inventory items"
ON public.inventario_itens FOR UPDATE
USING (true);

CREATE POLICY "Users can delete inventory items"
ON public.inventario_itens FOR DELETE
USING (true);