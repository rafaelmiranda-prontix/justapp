-- Script para verificar as políticas do bucket audio-messages
-- Execute este SQL no Supabase SQL Editor para verificar se as políticas estão corretas

-- 1. Verificar todas as políticas do bucket audio-messages
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%audio%'
ORDER BY policyname;

-- 2. Verificar se o bucket existe
SELECT name, id, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE name = 'audio-messages';

-- 3. Verificar políticas específicas (deve retornar 3 políticas)
SELECT 
    policyname,
    cmd as command,
    roles,
    CASE 
        WHEN with_check LIKE '%audio-messages%' THEN '✅ Correto'
        ELSE '❌ Nome do bucket incorreto na política'
    END as status
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname IN (
    'Allow service role to upload audio',
    'Allow public read access to audio',
    'Allow service role to delete audio'
  );
