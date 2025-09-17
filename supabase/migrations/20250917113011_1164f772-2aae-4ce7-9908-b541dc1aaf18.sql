-- Create admin user if it doesn't exist
INSERT INTO public.usuarios (nome, email, ldap_id, role)
VALUES ('Administrador', 'admin@sistema.local', 'admin', 'admin')
ON CONFLICT (ldap_id) DO NOTHING;