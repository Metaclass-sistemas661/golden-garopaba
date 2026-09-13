-- Criando o bucket de imagens de propriedades
INSERT INTO storage.buckets (id, name, public) 
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

-- Definindo as políticas de segurança do Storage
-- Permitir que qualquer pessoa veja as imagens (Select)
CREATE POLICY "Public Access for properties" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'properties');

-- Permitir que usuários autenticados façam upload
CREATE POLICY "Authenticated users can upload properties" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'properties');

-- Permitir que usuários autenticados atualizem suas imagens
CREATE POLICY "Authenticated users can update properties" 
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'properties');

-- Permitir que usuários autenticados deletem imagens
CREATE POLICY "Authenticated users can delete properties" 
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'properties');
