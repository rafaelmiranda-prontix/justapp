# Configuração do Bucket Privado para Anexos de Chat

Este guia explica como configurar o bucket privado no Supabase Storage para armazenar anexos de conversas entre advogado e cidadão.

## 1. Criar o Bucket Privado

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Storage** no menu lateral
4. Clique em **New bucket**
5. Configure:
   - **Name**: `chat-attachments`
   - **Public bucket**: ❌ **NÃO marque** (deve ser privado)
   - **File size limit**: 20 MB (ou o limite desejado)
   - **Allowed MIME types**: Deixe vazio ou configure tipos específicos:
     - `image/jpeg`, `image/png`, `image/gif`, `image/webp`
     - `application/pdf`
     - `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

## 2. Configurar Políticas RLS (Row Level Security)

Como o bucket é privado, precisamos de políticas RLS específicas para permitir upload e acesso controlado.

### Política de INSERT (Upload) - Service Role
```sql
CREATE POLICY "Allow service role to upload chat attachments"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'chat-attachments');
```

### Política de SELECT (Leitura) - Service Role
```sql
CREATE POLICY "Allow service role to read chat attachments"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'chat-attachments');
```

### Política de DELETE (Opcional) - Service Role
```sql
CREATE POLICY "Allow service role to delete chat attachments"
ON storage.objects
FOR DELETE
TO service_role
USING (bucket_id = 'chat-attachments');
```

**Nota**: A verificação de permissão (se o usuário é participante do match) é feita na API antes de gerar a signed URL. O RLS apenas garante que apenas o service_role pode fazer operações diretas no bucket.

## 3. Estrutura de Pastas

Os arquivos serão organizados assim:
```
chat-attachments/
  └── {matchId}/
      └── {userId}/
          └── {timestamp}-{randomId}.{ext}
```

Exemplo:
```
chat-attachments/
  └── YiMTDU9-Z7_rIB-dtN3e4/
      └── user123/
          └── 1704067200000-kj2h3k4j5h.pdf
```

## 4. Como Funciona

### Upload de Arquivo

1. Usuário seleciona um arquivo no chat
2. Frontend envia para `/api/upload` com `matchId` no FormData
3. API faz upload para o bucket privado `chat-attachments`
4. API gera uma signed URL que expira em 1 hora
5. Signed URL é salva no campo `anexoUrl` da mensagem

### Acesso ao Arquivo

1. Quando a signed URL expira, o frontend pode chamar `/api/chat/attachments/[path]`
2. A API verifica se o usuário é participante do match
3. Se autorizado, gera uma nova signed URL
4. Frontend usa a nova URL para exibir/download do arquivo

## 5. Segurança

⚠️ **Importante**:
- O bucket `chat-attachments` é **privado** (não público)
- Acesso é controlado via **signed URLs** que expiram após 1 hora
- A API verifica permissões antes de gerar signed URLs
- Apenas participantes do match podem acessar os anexos
- A `SUPABASE_SERVICE_ROLE_KEY` **NUNCA** deve ser exposta no frontend

## 6. Troubleshooting

### Erro: "new row violates row-level security policy"

**Causa**: O bucket tem RLS habilitado e não há políticas que permitam o upload.

**Solução**:
1. Verifique se o bucket `chat-attachments` existe
2. Verifique se as políticas RLS foram criadas corretamente
3. Certifique-se de que está usando a `SUPABASE_SERVICE_ROLE_KEY` (não a anon key)

### Erro: "Bucket not found"

**Causa**: O bucket não foi criado.

**Solução**: Crie o bucket `chat-attachments` no Supabase Storage (como privado).

### Erro: "Você não tem permissão para acessar este anexo"

**Causa**: O usuário não é participante do match.

**Solução**: Isso é esperado - apenas o advogado e o cidadão do match podem acessar os anexos.
