# 🚀 Guia de Atualização em Produção

## Processo de Deploy para Produção

### 1. Preparação Local

Antes de fazer deploy, certifique-se de que tudo está funcionando localmente:

```bash
# 1. Verificar se o build funciona
npm run build

# 2. Verificar migrations locais
npx prisma migrate status

# 3. Verificar se não há erros de TypeScript
npm run type-check
```

### 2. Aplicar Migration em Produção

#### Opção A: Via Vercel (Recomendado)

A Vercel aplica migrations automaticamente durante o build se você configurar o script `postinstall`:

1. **Verificar se o script está configurado no `package.json`**:
   ```json
   {
     "scripts": {
       "postinstall": "prisma generate"
     }
   }
   ```

2. **Criar um script de migration** (opcional, para aplicar manualmente):
   ```bash
   # Adicionar ao package.json
   "db:migrate:deploy": "prisma migrate deploy"
   ```

3. **Aplicar migration manualmente via Vercel CLI**:
   ```bash
   # Instalar Vercel CLI (se não tiver)
   npm i -g vercel
   
   # Fazer login
   vercel login
   
   # Aplicar migration em produção
   vercel env pull .env.prd
   npx prisma migrate deploy
   ```

#### Opção B: Via Terminal/SSH (Se tiver acesso ao servidor)

```bash
# 1. Conectar ao servidor de produção
ssh usuario@servidor-producao

# 2. Navegar até o diretório do projeto
cd /caminho/do/projeto

# 3. Carregar variáveis de ambiente de produção
source .env.prd  # ou export $(cat .env.prd | xargs)

# 4. Aplicar migrations
npx prisma migrate deploy

# 5. Verificar se foi aplicado
npx prisma migrate status
```

#### Opção C: Via Vercel Dashboard (Build Hook)

1. Acesse o dashboard da Vercel
2. Vá em **Settings** → **Git**
3. Crie um **Deploy Hook** para produção
4. Execute o hook após aplicar a migration manualmente

### 3. Deploy do Código

#### Via Git (Automático na Vercel)

```bash
# 1. Commit todas as mudanças
git add .
git commit -m "feat: adiciona sistema de logs de segurança e gestão de planos"

# 2. Push para a branch de produção
git push origin main  # ou master, dependendo da sua configuração
```

A Vercel fará o deploy automaticamente.

#### Via Vercel CLI

```bash
# 1. Fazer deploy
vercel --prod

# 2. Ou fazer deploy de um diretório específico
vercel --prod --cwd .
```

### 4. Verificação Pós-Deploy

Após o deploy, verifique:

```bash
# 1. Verificar se a tabela foi criada
npx prisma studio  # Conectar ao banco de produção
# Ou via SQL:
# SELECT * FROM security_logs LIMIT 1;

# 2. Testar a API de logs
curl https://seu-dominio.vercel.app/api/admin/security-logs

# 3. Verificar se o dashboard de auditoria está acessível
# Acesse: https://seu-dominio.vercel.app/admin/auditoria
```

### 5. Checklist de Deploy

- [ ] Migration aplicada em produção (`npx prisma migrate deploy`)
- [ ] Build local funcionando (`npm run build`)
- [ ] Variáveis de ambiente de produção configuradas
- [ ] Código commitado e pushado
- [ ] Deploy concluído na Vercel
- [ ] Tabela `security_logs` criada no banco
- [ ] Dashboard de auditoria acessível
- [ ] Testar criação de log (alterar um plano)

## Comandos Rápidos

### Aplicar Migration em Produção
```bash
# Carregar env de produção
npm run env:prd

# Aplicar migration
npx prisma migrate deploy

# Verificar status
npx prisma migrate status
```

### Deploy Completo
```bash
# 1. Build local para testar
npm run build

# 2. Commit e push
git add .
git commit -m "feat: sistema de logs de segurança"
git push origin main

# 3. Aplicar migration (se não for automático)
npm run env:prd
npx prisma migrate deploy
```

## Troubleshooting

### Erro: "Migration already applied"
```bash
# Se a migration já foi aplicada manualmente, marque como aplicada:
npx prisma migrate resolve --applied 20260204124947_add_security_logs
```

### Erro: "Table already exists"
```bash
# Se a tabela já existe, você pode:
# 1. Marcar a migration como aplicada
npx prisma migrate resolve --applied 20260204124947_add_security_logs

# 2. Ou dropar e recriar (CUIDADO: perde dados!)
# DROP TABLE security_logs;
# npx prisma migrate deploy
```

### Verificar se a tabela existe
```bash
# Via Prisma Studio
npx prisma studio

# Ou via SQL direto
psql $DATABASE_URL -c "\d security_logs"
```

## Variáveis de Ambiente Necessárias

Certifique-se de que estas variáveis estão configuradas na Vercel:

- `DATABASE_URL` - URL do banco de dados de produção
- `NEXTAUTH_SECRET` - Secret para autenticação
- `NEXTAUTH_URL` - URL da aplicação em produção
- Todas as outras variáveis do `.env.prd.example`

## Notas Importantes

1. **Backup**: Sempre faça backup do banco antes de aplicar migrations em produção
2. **Horário**: Prefira aplicar migrations em horários de baixo tráfego
3. **Teste**: Teste primeiro em staging/desenvolvimento
4. **Monitoramento**: Monitore os logs após o deploy
