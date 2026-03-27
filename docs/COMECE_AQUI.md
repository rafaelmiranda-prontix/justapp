# 🚀 Comece Aqui - LegalConnect MVP

> Guia rápido para começar a desenvolver após o setup completo.

Para ver **tudo que o projeto já oferece** (fluxos, admin, APIs, integrações), abra o catálogo: **[FUNCIONALIDADES.md](./FUNCIONALIDADES.md)**.

## ✅ Status Atual

**Fase 0: COMPLETA** 🎉

Você tem uma base sólida pronta para desenvolvimento:
- ✅ Next.js 16 configurado
- ✅ Database com 9 modelos
- ✅ Design System com 6 componentes
- ✅ Autenticação configurada
- ✅ Documentação completa

## 🎯 Próximo Passo: Fase 1

**Objetivo:** Implementar cadastro e autenticação de usuários.

### O que você vai construir:

1. **Cadastro de Cidadão** - Formulário para pessoa física
2. **Cadastro de Advogado** - Formulário com OAB
3. **Social Login** - Login com Google
4. **Perfis** - Edição de dados pessoais

## 🏃‍♂️ Começando Agora

### 1. Inicie o servidor

```bash
npm run dev
```

Acesse: http://localhost:3000

### 2. Abra o Prisma Studio (em outro terminal)

```bash
npm run db:studio
```

Acesse: http://localhost:5555

Aqui você pode visualizar e editar dados do banco em tempo real.

### 3. Abra seu editor de código

Estrutura que você vai trabalhar:

```
src/
├── app/
│   ├── (auth)/           # 👈 COMECE AQUI
│   │   ├── signin/       # Tela de login
│   │   └── signup/       # Tela de cadastro
│   │
│   ├── (cidadao)/        # Área do cidadão
│   └── (advogado)/       # Área do advogado
│
└── components/
    ├── forms/            # 👈 CRIE AQUI
    │   ├── signup-cidadao-form.tsx
    │   └── signup-advogado-form.tsx
    │
    └── ui/               # ✅ JÁ PRONTO
        ├── button.tsx
        ├── input.tsx
        └── ...
```

## 📝 Primeira Tarefa: Cadastro de Cidadão

### Passo 1: Criar a rota de cadastro

Crie: `src/app/(auth)/signup/cidadao/page.tsx`

```typescript
export default function SignupCidadaoPage() {
  return (
    <div className="container mx-auto max-w-md py-16">
      <h1 className="text-3xl font-bold mb-8">Cadastro de Cidadão</h1>
      {/* Formulário aqui */}
    </div>
  )
}
```

### Passo 2: Criar o formulário

Crie: `src/components/forms/signup-cidadao-form.tsx`

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Senha muito curta'),
})

type FormData = z.infer<typeof schema>

export function SignupCidadaoForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    // TODO: Criar API route
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome completo</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="phone">Telefone (opcional)</Label>
        <Input id="phone" {...register('phone')} />
      </div>

      <div>
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" {...register('password')} />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full">
        Criar conta
      </Button>
    </form>
  )
}
```

### Passo 3: Criar a API Route

Crie: `src/app/api/users/cidadao/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Verificar se email já existe
    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (exists) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await hash(data.password, 10)

    // Criar usuário + cidadão
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: 'CIDADAO',
        cidadao: {
          create: {},
        },
      },
      include: {
        cidadao: true,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Erro ao criar cidadão:', error)
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    )
  }
}
```

### Passo 4: Conectar tudo

Atualize o formulário para fazer a requisição:

```typescript
const onSubmit = async (data: FormData) => {
  const res = await fetch('/api/users/cidadao', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const result = await res.json()

  if (result.success) {
    toast({ title: 'Sucesso!', description: 'Conta criada' })
    // Redirect para login
    window.location.href = '/signin'
  } else {
    toast({
      title: 'Erro',
      description: result.error,
      variant: 'destructive',
    })
  }
}
```

### Passo 5: Testar

1. Acesse http://localhost:3000/signup/cidadao
2. Preencha o formulário
3. Clique em "Criar conta"
4. Verifique no Prisma Studio se o usuário foi criado

## 🎓 Recursos de Aprendizado

### Documentação do Projeto

1. **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Padrões e arquitetura
2. **[COMANDOS_UTEIS.md](docs/COMANDOS_UTEIS.md)** - Referência de comandos
3. **[CHECKLIST_DESENVOLVIMENTO.md](.github/CHECKLIST_DESENVOLVIMENTO.md)** - Todas as tarefas

### Documentação Externa

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)
- [shadcn/ui](https://ui.shadcn.com)

## 🛠️ Ferramentas Úteis

### Durante o Desenvolvimento

```bash
# Terminal 1: Servidor
npm run dev

# Terminal 2: Prisma Studio
npm run db:studio

# Terminal 3: Type check contínuo (opcional)
npm run type-check -- --watch
```

### Debugging

```bash
# Ver logs do servidor Next.js
# Os logs aparecem no terminal onde você rodou `npm run dev`

# Ver dados do banco
npm run db:studio

# Ver schema atualizado
npx prisma format
```

## ❓ Dúvidas Comuns

### "Module not found" ou erro de import

```bash
# Limpar cache e reinstalar
rm -rf .next node_modules
npm install
npm run dev
```

### "Prisma Client not generated"

```bash
npm run db:generate
```

### Erro de conexão com banco

```bash
# Verificar DATABASE_URL no .env
cat .env | grep DATABASE_URL

# Testar conexão
npm run db:push
```

### Erro de tipo TypeScript

```bash
# Gerar tipos do Prisma
npm run db:generate

# Verificar erros
npm run type-check
```

## 📋 Checklist Antes de Começar

- [ ] Servidor rodando (`npm run dev`)
- [ ] Prisma Studio aberto (`npm run db:studio`)
- [ ] Editor de código aberto
- [ ] Documentação à mão
- [ ] Terminal visível para logs

## 🎯 Objetivo da Primeira Sessão

Ao final da primeira sessão de desenvolvimento, você deve ter:

- [x] Página de cadastro funcionando
- [x] Formulário validando dados
- [x] API criando usuário no banco
- [x] Redirecionamento para login
- [x] Notificações (toast) funcionando

**Tempo estimado:** 2-3 horas

## 🚀 Próximas Tarefas

Depois do cadastro de cidadão:

1. Cadastro de advogado (similar, mas com OAB)
2. Página de login
3. Google OAuth
4. Perfis de usuário

Consulte o [CHECKLIST_DESENVOLVIMENTO.md](.github/CHECKLIST_DESENVOLVIMENTO.md) para a lista completa.

## 💡 Dicas

### 1. Use o Prisma Studio
É muito mais fácil debugar vendo os dados visualmente.

### 2. Console.log é seu amigo
```typescript
console.log('Data recebida:', data)
console.log('Usuário criado:', user)
```

### 3. Teste cada parte separadamente
- Primeiro: formulário coleta dados
- Depois: validação funciona
- Depois: API cria no banco
- Por último: integração completa

### 4. Commits frequentes
```bash
git add .
git commit -m "feat: adiciona cadastro de cidadão"
```

### 5. Leia os erros
TypeScript e Prisma dão erros muito descritivos. Leia com atenção!

## 🎉 Pronto para Começar!

Você tem tudo que precisa. Qualquer dúvida, consulte a documentação em `docs/`.

**Boa sorte e bom código!** 🚀

---

**Criado em:** 29 de Janeiro de 2026
**Última atualização:** 29 de Janeiro de 2026
