-- Desabilitar RLS nas tabelas de inventário
ALTER TABLE inventarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_itens DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas antigas
DROP POLICY IF EXISTS "Users can view all inventarios" ON inventarios;
DROP POLICY IF EXISTS "Users can insert inventarios" ON inventarios;
DROP POLICY IF EXISTS "Users can update inventarios" ON inventarios;
DROP POLICY IF EXISTS "Users can delete inventarios" ON inventarios;

DROP POLICY IF EXISTS "Users can view all inventario_itens" ON inventario_itens;
DROP POLICY IF EXISTS "Users can insert inventario_itens" ON inventario_itens;
DROP POLICY IF EXISTS "Users can update inventario_itens" ON inventario_itens;
DROP POLICY IF EXISTS "Users can delete inventario_itens" ON inventario_itens;