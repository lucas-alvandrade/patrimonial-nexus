-- Remover políticas antigas da tabela inventarios
DROP POLICY IF EXISTS "Allow full access to inventarios for authenticated users" ON inventarios;

-- Criar novas políticas para inventarios
CREATE POLICY "Users can view all inventarios"
ON inventarios
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert inventarios"
ON inventarios
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update inventarios"
ON inventarios
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete inventarios"
ON inventarios
FOR DELETE
TO authenticated
USING (true);

-- Remover políticas antigas da tabela inventario_itens
DROP POLICY IF EXISTS "Allow full access to inventario_itens for authenticated users" ON inventario_itens;

-- Criar novas políticas para inventario_itens
CREATE POLICY "Users can view all inventario_itens"
ON inventario_itens
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert inventario_itens"
ON inventario_itens
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update inventario_itens"
ON inventario_itens
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can delete inventario_itens"
ON inventario_itens
FOR DELETE
TO authenticated
USING (true);