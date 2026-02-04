# 🔧 Como Aplicar a Migration de Security Logs

## Problema: Pool de Conexões Esgotado

Se você está recebendo o erro `MaxClientsInSessionMode: max clients reached`, o pool de conexões do Supabase está esgotado.

## Soluções

### Opção 1: Aplicar Manualmente via SQL (Recomendado)

1. **Acesse o Supabase Dashboard**:
   - Vá para o projeto no Supabase
   - Clique em **SQL Editor**

2. **Execute o script SQL**:
   - Copie o conteúdo de `scripts/create-security-logs-table.sql`
   - Cole no SQL Editor
   - Clique em **Run**

3. **Verificar se foi criado**:
   ```sql
   SELECT * FROM security_logs LIMIT 1;
   ```

### Opção 2: Usar DIRECT_URL

Se você tem `DIRECT_URL` configurado (não usa pool):

```bash
# Carregar env de desenvolvimento
npm run env:dev

# Aplicar migration usando DIRECT_URL
DIRECT_URL=$DIRECT_URL npx prisma migrate deploy
```

### Opção 3: Aguardar e Tentar Novamente

O pool de conexões se libera automaticamente. Aguarde alguns minutos e tente:

```bash
# Aguardar 2 minutos
sleep 120

# Tentar novamente
npx prisma migrate deploy
```

### Opção 4: Fechar Conexões Abertas

Se você tem acesso ao banco:

```sql
-- Ver conexões ativas
SELECT pid, usename, application_name, client_addr, state 
FROM pg_stat_activity 
WHERE datname = current_database();

-- Fechar conexões ociosas (CUIDADO!)
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database()
  AND state = 'idle'
  AND pid <> pg_backend_pid();
```

## Verificação

Após aplicar a migration, verifique:

```bash
# Via Prisma Studio
npx prisma studio

# Ou via SQL
psql $DATABASE_URL -c "\d security_logs"
```

## Para Produção

Em produção, use o mesmo processo:

1. Acesse o Supabase Dashboard de produção
2. Execute o SQL manualmente
3. Ou use `DIRECT_URL` se disponível
