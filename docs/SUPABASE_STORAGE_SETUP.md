# Configuração do Supabase Storage para Áudio

Este guia explica como configurar o bucket de áudio no Supabase Storage para permitir uploads.

## 1. Criar o Bucket

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Storage** no menu lateral
4. Clique em **New bucket**
5. Configure:
   - **Name**: `audio-messages`
   - **Public bucket**: ✅ Marque como público (para permitir acesso aos arquivos)
   - **File size limit**: 10 MB (ou o limite desejado)
   - **Allowed MIME types**: `audio/webm`, `audio/webm;codecs=opus`

## 2. Configurar Políticas RLS (Row Level Security)

### Opção A: Desabilitar RLS (Recomendado para este caso)

1. No bucket `audio-messages`, vá em **Policies**
2. Se o RLS estiver habilitado, você pode desabilitá-lo OU criar políticas que permitam tudo

### Opção B: Criar Políticas RLS (Mais seguro)

Se preferir manter RLS habilitado, crie as seguintes políticas:

#### Política de INSERT (Upload)
```sql
CREATE POLICY "Allow service role to upload audio"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'audio-messages');
```

#### Política de SELECT (Leitura)
```sql
CREATE POLICY "Allow public read access to audio"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'audio-messages');
```

#### Política de DELETE (Opcional)
```sql
CREATE POLICY "Allow service role to delete audio"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'audio-messages');
```

## 3. Variáveis de Ambiente

Certifique-se de ter as seguintes variáveis no seu `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
```

### Como obter a Service Role Key:

1. No Dashboard do Supabase, vá em **Settings** → **API**
2. Copie a **service_role** key (⚠️ **NUNCA** exponha essa chave no frontend!)
3. Adicione ao `.env` como `SUPABASE_SERVICE_ROLE_KEY`

## 4. Verificar Configuração

Após configurar, teste o upload:

```bash
# O código já está implementado, apenas teste enviando um áudio pelo chat
```

## Troubleshooting

### Erro: "new row violates row-level security policy"

**Causa**: O bucket tem RLS habilitado e não há políticas que permitam o upload.

**Solução**:
1. Verifique se o bucket `audio-messages` existe
2. Verifique se o RLS está desabilitado OU se há políticas que permitam upload
3. Certifique-se de que está usando a `SUPABASE_SERVICE_ROLE_KEY` (não a anon key)

### Erro: "Bucket not found"

**Causa**: O bucket não foi criado.

**Solução**: Crie o bucket `audio-messages` no Supabase Storage.

### Erro: "File size exceeds limit"

**Causa**: O arquivo é maior que o limite configurado.

**Solução**: Aumente o limite no bucket ou comprima o áudio antes do upload.

## Estrutura de Pastas

Os arquivos serão organizados assim:
```
audio-messages/
  └── {sessionId}/
      └── {timestamp}-{randomId}.webm
```

Exemplo:
```
audio-messages/
  └── anon_abc123xyz/
      └── 1704067200000-kj2h3k4j5h.webm
```

## Segurança

⚠️ **Importante**:
- A `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** deve ser exposta no frontend
- Use apenas em API routes do Next.js (server-side)
- O bucket pode ser público para leitura, mas o upload deve ser controlado pelo backend
