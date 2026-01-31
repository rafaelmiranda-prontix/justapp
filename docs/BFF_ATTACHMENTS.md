# BFF Autenticado para Anexos de Chat

## Visão Geral

O BFF (Backend for Frontend) autenticado é uma API que serve arquivos anexos de forma segura, sempre validando autenticação e permissões antes de servir qualquer arquivo.

## Vantagens

1. **Acesso permanente**: Não há URLs que expiram
2. **Controle total**: Validação de autenticação e permissões em cada requisição
3. **Segurança**: Apenas participantes do match podem acessar os anexos
4. **Auditoria**: Possibilidade de adicionar logs de acesso
5. **Cache controlado**: Headers de cache configuráveis

## Como Funciona

### 1. Upload de Arquivo

Quando um arquivo é enviado no chat:

1. Frontend envia arquivo para `/api/upload` com `matchId` no FormData
2. API faz upload para o bucket privado `chat-attachments` no Supabase
3. API retorna a URL do BFF: `/api/chat/attachments/{path}`
4. Esta URL é salva no campo `anexoUrl` da mensagem

### 2. Acesso ao Arquivo

Quando o usuário acessa um anexo:

1. Frontend faz requisição para `/api/chat/attachments/{path}`
2. BFF valida:
   - Se o usuário está autenticado
   - Se o usuário é participante do match (advogado ou cidadão)
3. Se autorizado, BFF baixa o arquivo do Supabase Storage
4. BFF retorna o arquivo como stream com headers apropriados

## Estrutura da URL

```
/api/chat/attachments/{matchId}/{userId}/{timestamp}-{randomId}.{ext}
```

Exemplo:
```
/api/chat/attachments/YiMTDU9-Z7_rIB-dtN3e4/user123/1704067200000-kj2h3k4j5h.pdf
```

## Headers de Resposta

O BFF retorna os seguintes headers:

- `Content-Type`: Tipo MIME do arquivo (detectado automaticamente)
- `Content-Disposition`: `inline; filename="..."` (para exibição no navegador)
- `Cache-Control`: `private, max-age=3600` (cache por 1 hora)
- `X-Content-Type-Options`: `nosniff` (segurança)

## Tipos de Arquivo Suportados

O BFF detecta automaticamente o content type baseado na extensão:

### Imagens
- `.jpg`, `.jpeg` → `image/jpeg`
- `.png` → `image/png`
- `.gif` → `image/gif`
- `.webp` → `image/webp`

### Documentos
- `.pdf` → `application/pdf`
- `.doc` → `application/msword`
- `.docx` → `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `.xls` → `application/vnd.ms-excel`
- `.xlsx` → `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

### Texto
- `.txt` → `text/plain`

### Áudio
- `.mp3` → `audio/mpeg`
- `.wav` → `audio/wav`
- `.webm` → `audio/webm`

## Segurança

### Validações Realizadas

1. **Autenticação**: Verifica se o usuário está logado
2. **Autorização**: Verifica se o usuário é participante do match
3. **Path validation**: Valida o formato do path
4. **Match existence**: Verifica se o match existe

### Códigos de Status

- `200`: Arquivo servido com sucesso
- `400`: Path inválido
- `401`: Não autenticado
- `403`: Sem permissão para acessar o anexo
- `404`: Match ou arquivo não encontrado
- `500`: Erro interno do servidor

## Uso no Frontend

### Exibindo um Anexo

```tsx
{message.anexoUrl && (
  <a
    href={message.anexoUrl}
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs underline mt-1 block"
  >
    Ver anexo
  </a>
)}
```

### Exibindo uma Imagem

```tsx
{message.anexoUrl && message.anexoUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
  <img
    src={message.anexoUrl}
    alt="Anexo"
    className="max-w-full rounded mt-2"
  />
)}
```

## Cache

O BFF retorna `Cache-Control: private, max-age=3600`, o que significa:

- O arquivo é cacheado no navegador por 1 hora
- O cache é privado (não compartilhado entre usuários)
- Após 1 hora, o navegador faz uma nova requisição (que será validada novamente)

## Performance

### Otimizações

1. **Streaming**: O arquivo é servido como stream, não carregado completamente na memória
2. **Cache**: Headers de cache reduzem requisições desnecessárias
3. **Validação eficiente**: Verificação de permissões usa índices do banco

### Limitações

- Arquivos grandes podem demorar mais para serem servidos
- Cada requisição valida permissões (overhead mínimo)
- Não há CDN (pode ser adicionado no futuro)

## Monitoramento

### Logs

O BFF registra:
- Erros de autenticação/autorização
- Erros ao baixar arquivos do Supabase
- Erros de validação de path

### Métricas Recomendadas

- Número de requisições por arquivo
- Tempo de resposta
- Taxa de erro
- Tamanho médio dos arquivos servidos

## Migração de Signed URLs

Se você estava usando signed URLs antes, a migração é simples:

**Antes:**
```typescript
const signedUrl = await getChatAttachmentSignedUrl(path)
// URL expira após 1 hora
```

**Depois:**
```typescript
const bffUrl = `/api/chat/attachments/${path}`
// URL sempre funciona (com autenticação)
```

## Troubleshooting

### Erro 401: Não autorizado

**Causa**: Usuário não está logado.

**Solução**: Verificar se a sessão está ativa.

### Erro 403: Sem permissão

**Causa**: Usuário não é participante do match.

**Solução**: Verificar se o usuário é o advogado ou cidadão do match.

### Erro 404: Arquivo não encontrado

**Causa**: Arquivo não existe no Supabase Storage ou path está incorreto.

**Solução**: Verificar se o arquivo foi enviado corretamente e se o path está correto.

### Arquivo não carrega

**Causa**: Pode ser problema de CORS ou cache.

**Solução**: 
1. Verificar console do navegador
2. Limpar cache
3. Verificar se a URL está correta
