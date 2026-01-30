# Comandos Úteis - LegalConnect

## Desenvolvimento

### Iniciar servidor
```bash
npm run dev
```
Abre em: http://localhost:3000

### Build para produção
```bash
npm run build
npm start
```

### Verificar tipos
```bash
npm run type-check
```

### Formatar código
```bash
npm run format
```

### Lint
```bash
npm run lint
```

## Database (Prisma)

### Gerar cliente Prisma
```bash
npm run db:generate
```
Execute sempre após alterar `schema.prisma`

### Push schema (desenvolvimento)
```bash
npm run db:push
```
Sincroniza schema com o banco sem criar migration

### Criar migration
```bash
npm run db:migrate
```
Cria uma nova migration com as alterações do schema

### Abrir Prisma Studio
```bash
npm run db:studio
```
Interface visual do banco em: http://localhost:5555

### Popular banco (seed)
```bash
npm run db:seed
```
Executa `prisma/seed.ts`

### Reset completo do banco
```bash
npx prisma migrate reset
```
⚠️ ATENÇÃO: Apaga todos os dados!

## Git

### Commits convencionais
```bash
git commit -m "feat: adiciona cadastro de advogado"
git commit -m "fix: corrige validação de OAB"
git commit -m "docs: atualiza README"
git commit -m "refactor: melhora componente Button"
git commit -m "test: adiciona testes do hook useUser"
```

Prefixos:
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação, sem mudança de código
- `refactor:` - Refatoração
- `test:` - Testes
- `chore:` - Tarefas de manutenção

## NextAuth

### Gerar secret
```bash
openssl rand -base64 32
```
Use o resultado em `NEXTAUTH_SECRET`

### Debug de sessão
```bash
# No navegador
console.log(await fetch('/api/auth/session').then(r => r.json()))
```

## Prisma

### Ver queries executadas
```env
# .env
DATABASE_URL="postgresql://...?schema=public&connection_limit=5&pool_timeout=20&log=query"
```

### Formatação do schema
```bash
npx prisma format
```

### Validar schema
```bash
npx prisma validate
```

## Debugging

### Logs do Next.js
```bash
# Desenvolvimento com logs detalhados
DEBUG=* npm run dev

# Ver apenas erros
NODE_ENV=development npm run dev 2>&1 | grep ERROR
```

### Limpar cache do Next.js
```bash
rm -rf .next
npm run dev
```

### Limpar node_modules
```bash
rm -rf node_modules package-lock.json
npm install
```

## PostgreSQL Local

### Criar banco
```bash
createdb legalconnect
```

### Conectar ao banco
```bash
psql legalconnect
```

### Ver tabelas
```sql
\dt
```

### Ver estrutura de uma tabela
```sql
\d users
```

### Backup
```bash
pg_dump legalconnect > backup.sql
```

### Restore
```bash
psql legalconnect < backup.sql
```

## Testes (Futuro)

### Rodar todos os testes
```bash
npm test
```

### Rodar com coverage
```bash
npm test -- --coverage
```

### Rodar testes específicos
```bash
npm test -- hooks/use-user
```

### Rodar testes em watch mode
```bash
npm test -- --watch
```

## Performance

### Analisar bundle
```bash
npm run build
npx @next/bundle-analyzer
```

### Verificar lighthouse
```bash
npx lighthouse http://localhost:3000 --view
```

## Docker (Futuro)

### Build
```bash
docker build -t legalconnect .
```

### Run
```bash
docker run -p 3000:3000 legalconnect
```

### Docker Compose
```bash
docker-compose up -d
docker-compose down
docker-compose logs -f
```

## Kubernetes (Deploy)

### Apply configurações
```bash
kubectl apply -f k8s/
```

### Ver pods
```bash
kubectl get pods
```

### Logs
```bash
kubectl logs -f <pod-name>
```

### Port forward
```bash
kubectl port-forward svc/legalconnect 3000:3000
```

## Utilitários

### Verificar portas em uso
```bash
lsof -i :3000
```

### Matar processo em uma porta
```bash
kill -9 $(lsof -ti:3000)
```

### Verificar espaço em disco
```bash
du -sh node_modules
du -sh .next
```

### Atualizar dependências
```bash
# Ver updates disponíveis
npm outdated

# Atualizar minor/patch
npm update

# Atualizar major (cuidado!)
npx npm-check-updates -u
npm install
```

## VS Code

### Extensões recomendadas
- Prisma
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens
- Error Lens

### Configurações
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

## Atalhos do Next.js

### Variáveis de ambiente
```typescript
// Públicas (acessíveis no cliente)
process.env.NEXT_PUBLIC_APP_URL

// Privadas (apenas no servidor)
process.env.DATABASE_URL
```

### Revalidação
```typescript
// Em uma página
export const revalidate = 3600 // 1 hora

// Programaticamente
revalidatePath('/advogados')
revalidateTag('advogados')
```

### Cache
```typescript
// Desabilitar cache
fetch(url, { cache: 'no-store' })

// Cache por tempo
fetch(url, { next: { revalidate: 3600 } })
```

## Troubleshooting

### Erro: "Module not found"
```bash
rm -rf .next node_modules
npm install
npm run dev
```

### Erro: "Prisma Client not generated"
```bash
npm run db:generate
```

### Erro: "Port 3000 already in use"
```bash
kill -9 $(lsof -ti:3000)
npm run dev
```

### Erro: "Cannot find module '@/...'
```bash
# Verificar tsconfig.json paths
npm run type-check
```

### Erro: Database connection
```bash
# Verificar se PostgreSQL está rodando
pg_isready

# Verificar .env
cat .env | grep DATABASE_URL
```

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
