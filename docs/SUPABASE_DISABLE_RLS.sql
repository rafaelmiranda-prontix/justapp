-- Script para DESABILITAR RLS no bucket audio-messages
-- Use esta opção se as políticas não estiverem funcionando
-- Execute no Supabase SQL Editor

-- IMPORTANTE: Desabilitar RLS no bucket permite upload sem políticas
-- Isso é seguro se você estiver usando service role key no backend

-- 1. Verificar se o RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage' 
  AND tablename = 'objects';

-- 2. Desabilitar RLS na tabela storage.objects (afeta todos os buckets)
-- CUIDADO: Isso desabilita RLS para TODOS os buckets
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. SOLUÇÃO RECOMENDADA: Criar política que permite TUDO para service_role
-- Isso mantém RLS habilitado mas permite service_role fazer qualquer operação
-- Deletar políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Allow service role full access" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role to upload audio" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role to delete audio" ON storage.objects;

-- Criar política única que permite TUDO para service_role em TODOS os buckets
-- Isso é seguro porque service_role só é usada no backend (nunca no frontend)
CREATE POLICY "Allow service role full access"
ON storage.objects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Manter a política de leitura pública apenas para o bucket audio-messages
DROP POLICY IF EXISTS "Allow public read access to audio" ON storage.objects;

CREATE POLICY "Allow public read access to audio"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio-messages');

-- 4. Verificar se a política foi criada
SELECT 
    policyname,
    cmd,
    roles,
    CASE 
        WHEN with_check = 'true' AND qual = 'true' THEN '✅ Permite tudo'
        ELSE '❌ Verificar'
    END as status
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname = 'Allow service role full access';
