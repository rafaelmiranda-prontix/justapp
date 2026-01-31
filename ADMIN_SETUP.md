# Guia de Configuração do Administrador

Este guia explica como criar e configurar usuários administradores na plataforma.

## 🎯 Opções Disponíveis

### Opção 1: Script Interativo (Recomendado) ⭐

Modo mais fácil - o script pede os dados interativamente:

```bash
npm run admin:create
```

O script vai pedir:
- Nome completo do admin
- Email
- Senha (opcional - pode definir depois)

### Opção 2: Via Argumentos da Linha de Comando

```bash
npm run admin:create "Nome do Admin" "admin@email.com" "senha123"
```

Ou diretamente com ts-node:

```bash
npx tsx scripts/create-admin.ts "Nome do Admin" "admin@email.com"
```

### Opção 3: Via Variáveis de Ambiente

```bash
SEED_ADMIN_NAME="Nome Admin" SEED_ADMIN_EMAIL="admin@email.com" npm run admin:seed
```

Ou adicione ao `.env`:

```env
SEED_ADMIN_NAME="Administrador Geral"
SEED_ADMIN_EMAIL="admin@legalmatch.com.br"
```

E execute:

```bash
npm run admin:seed
```

### Opção 4: Direto no Banco de Dados

Se você tem acesso direto ao banco (Supabase, PostgreSQL, etc.):

```sql
-- 1. Criar usuário
INSERT INTO users (id, name, email, "emailVerified", role, status, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Nome do Admin',
  'admin@email.com',
  NOW(),
  'ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
);
```

---

## 🔐 Definir/Alterar Senha

### Se o usuário já existe mas precisa de senha:

```bash
npm run admin:password
```

Ou com argumentos:

```bash
npm run admin:password "admin@email.com" "novaSenha123"
```

### Requisitos de Senha:
- Mínimo 6 caracteres
- Recomendado: letras, números e caracteres especiais

---

## 📋 Fluxo Completo (Passo a Passo)

### Para Desenvolvimento Local:

```bash
# 1. Criar o admin
npm run admin:create

# Quando solicitado, digite:
# Nome: Admin de Teste
# Email: admin@test.com
# Senha: (deixe vazio por enquanto)

# 2. Fazer login via Google/GitHub
# Ou definir senha:
npm run admin:password
# Email: admin@test.com
# Senha: senha123
# Confirmar: senha123

# 3. Acessar o painel
# http://localhost:3000/admin/dashboard
```

### Para Produção:

```bash
# 1. Conectar ao banco de produção
# Certifique-se que DATABASE_URL no .env aponta para produção

# 2. Criar admin via variáveis de ambiente (mais seguro)
SEED_ADMIN_NAME="Admin Produção" \
SEED_ADMIN_EMAIL="admin@suaempresa.com" \
npm run admin:seed

# 3. O admin deve fazer login via:
# - Google OAuth (recomendado)
# - GitHub OAuth
# - Ou usar "Esqueci minha senha" para criar uma senha
```

---

## 🛡️ Segurança

### Boas Práticas:

1. **Email Corporativo**
   - Use email profissional (ex: admin@empresa.com)
   - Não use emails pessoais em produção

2. **Senha Forte**
   - Mínimo 12 caracteres
   - Combine letras maiúsculas, minúsculas, números e símbolos
   - Use um gerenciador de senhas

3. **Autenticação OAuth**
   - Prefira login via Google/GitHub quando possível
   - Mais seguro que senha tradicional

4. **Múltiplos Admins**
   - Crie pelo menos 2 admins
   - Para redundância e auditoria

5. **Auditoria**
   - Monitore ações dos admins
   - Revise periodicamente permissões

---

## 🔍 Verificar Admins Existentes

### Via Prisma Studio:

```bash
npm run db:studio
```

Navegue até a tabela `users` e filtre por `role = "ADMIN"`

### Via Banco de Dados:

```sql
SELECT id, name, email, role, status, "emailVerified"
FROM users
WHERE role = 'ADMIN'
ORDER BY "createdAt" DESC;
```

### Via Script (a criar):

```bash
npm run admin:list
```

---

## ❓ Troubleshooting

### "Usuário já existe"

Se tentar criar um admin com email que já existe, o script oferece:
- Atualizar usuário existente para ADMIN
- Ou cancelar a operação

### "Erro ao fazer login"

1. Verifique se o email está correto
2. Tente "Esqueci minha senha"
3. Ou faça login via Google/GitHub
4. Verifique se `role = 'ADMIN'` no banco

### "Acesso negado ao painel admin"

Verifique no banco de dados:

```sql
SELECT role, status FROM users WHERE email = 'seu@email.com';
```

Deve retornar:
- `role`: ADMIN
- `status`: ACTIVE

Se não, atualize:

```sql
UPDATE users
SET role = 'ADMIN', status = 'ACTIVE'
WHERE email = 'seu@email.com';
```

### "Cannot find module 'bcryptjs'"

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

---

## 📚 Estrutura do Admin

### Rotas Disponíveis:

- `/admin/dashboard` - Dashboard principal
- `/admin/advogados` - Gestão de advogados
- `/admin/avaliacoes` - Moderação de avaliações
- `/admin/usuarios` - Gestão de usuários
- `/admin/chat-config` - Configuração do chat

### Permissões:

Apenas usuários com `role = 'ADMIN'` podem acessar rotas `/admin/*`

---

## 🚀 Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| Criar Admin | `npm run admin:create` | Modo interativo |
| Definir Senha | `npm run admin:password` | Alterar/definir senha |
| Seed Admin | `npm run admin:seed` | Criar admin padrão |

---

## 📝 Exemplo Completo

```bash
# 1. Clone o repositório e instale dependências
git clone <repo>
npm install

# 2. Configure o banco de dados
npm run db:push

# 3. Crie um admin
npm run admin:create

# Preencha quando solicitado:
# Nome: João Silva
# Email: joao@empresa.com
# Senha: (vazio - vai definir depois)

# 4. Inicie o servidor
npm run dev

# 5. Acesse http://localhost:3000/admin/dashboard
# Faça login via Google ou use "Esqueci senha"

# 6. Configure o sistema pelo painel admin
```

---

## 🎯 Primeiro Acesso

Após criar o admin:

1. **Acesse** `/admin/dashboard`
2. **Configure** `/admin/chat-config` (escolha MVP ou Pusher)
3. **Revise** usuários e advogados
4. **Teste** o sistema

---

## 💡 Dicas

- Para ambiente de teste, use emails como `admin+test@email.com`
- Mantenha backup dos emails/senhas de admin em local seguro
- Em produção, use 2FA (Two-Factor Authentication) se possível
- Revise logs de admin regularmente

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor
2. Confirme role no banco de dados
3. Tente recriar o usuário
4. Consulte a documentação do NextAuth

---

**Última atualização:** 2026-01-31
