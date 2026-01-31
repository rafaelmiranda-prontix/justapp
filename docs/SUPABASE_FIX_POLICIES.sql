-- Script para corrigir/atualizar políticas do bucket audio-messages
-- Execute este SQL no Supabase SQL Editor

-- IMPORTANTE: Certifique-se de que o bucket se chama exatamente "audio-messages"
-- Verifique primeiro executando: SELECT name FROM storage.buckets;

-- 1. Deletar políticas existentes (se necessário)
DROP POLICY IF EXISTS "Allow service role to upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to audio" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role to delete audio" ON storage.objects;

-- 2. Criar políticas corretas com o nome exato do bucket
-- Política de INSERT (Upload) - Permite service_role fazer upload
CREATE POLICY "Allow service role to upload audio"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'audio-messages');

-- Política de SELECT (Leitura pública) - Permite qualquer um ler
CREATE POLICY "Allow public read access to audio"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio-messages');

-- Política de DELETE (Opcional) - Permite service_role deletar
CREATE POLICY "Allow service role to delete audio"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'audio-messages');

-- 3. Verificar se as políticas foram criadas corretamente
SELECT 
    policyname,
    cmd,
    roles,
    CASE 
        WHEN with_check LIKE '%audio-messages%' OR qual LIKE '%audio-messages%' THEN '✅ OK'
        ELSE '❌ Verificar'
    END as status
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%audio%';
