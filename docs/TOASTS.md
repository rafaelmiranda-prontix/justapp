# Sistema de Toasts Elegantes

O LegalConnect utiliza um sistema de toasts elegante e consistente para notificações ao usuário.

## Variantes Disponíveis

O sistema possui 5 variantes de toasts, cada uma com cores e ícones específicos:

### 1. **Success** (Verde)
- **Ícone:** CheckCircle2 ✓
- **Uso:** Operações bem-sucedidas (login, cadastro, salvamento)
- **Exemplo:**
```tsx
toast({
  variant: 'success',
  title: 'Conta criada com sucesso!',
  description: 'Faça login para continuar',
})
```

### 2. **Destructive** (Vermelho)
- **Ícone:** XCircle ✕
- **Uso:** Erros críticos, falhas de validação
- **Exemplo:**
```tsx
toast({
  variant: 'destructive',
  title: 'Erro ao fazer login',
  description: 'Email ou senha inválidos',
})
```

### 3. **Warning** (Amarelo)
- **Ícone:** AlertTriangle ⚠
- **Uso:** Avisos, cancelamentos, ações reversíveis
- **Exemplo:**
```tsx
toast({
  variant: 'warning',
  title: 'Assinatura cancelada',
  description: 'Você voltará ao plano gratuito',
})
```

### 4. **Info** (Azul)
- **Ícone:** Info ℹ
- **Uso:** Informações, dicas, notificações neutras
- **Exemplo:**
```tsx
toast({
  variant: 'info',
  title: 'Processando...',
  description: 'Aguarde um momento',
})
```

### 5. **Default** (Neutro)
- **Ícone:** Nenhum
- **Uso:** Mensagens genéricas
- **Exemplo:**
```tsx
toast({
  title: 'Notificação',
  description: 'Algo aconteceu',
})
```

## Como Usar

### 1. Importar o hook
```tsx
import { useToast } from '@/hooks/use-toast'

export function MyComponent() {
  const { toast } = useToast()

  // ...
}
```

### 2. Usar diretamente
```tsx
const handleClick = () => {
  toast({
    variant: 'success',
    title: 'Sucesso!',
    description: 'Operação concluída',
  })
}
```

### 3. Usar helpers (recomendado)
```tsx
import { useToast } from '@/hooks/use-toast'
import { createToastHelpers } from '@/lib/toast-helpers'

export function MyComponent() {
  const { toast } = useToast()
  const toastHelpers = createToastHelpers(toast)

  const handleSuccess = () => {
    toastHelpers.success('Sucesso!', 'Tudo certo')
  }

  const handleError = () => {
    toastHelpers.error('Erro', 'Algo deu errado')
  }
}
```

### 4. Usar mensagens pré-configuradas
```tsx
import { useToast } from '@/hooks/use-toast'
import { toastMessages } from '@/lib/toast-helpers'

export function LoginForm() {
  const { toast } = useToast()

  const handleLogin = async () => {
    try {
      // ... login
      toast(toastMessages.auth.loginSuccess)
    } catch (error) {
      toast(toastMessages.auth.loginError)
    }
  }
}
```

## Mensagens Pré-configuradas

O arquivo `src/lib/toast-helpers.ts` contém mensagens comuns:

- **Auth:** `loginSuccess`, `loginError`, `signupSuccess`, `signupError`, `logoutSuccess`
- **Match:** `accepted`, `rejected`
- **Message:** `sent`, `error`
- **Subscription:** `success`, `canceled`, `error`
- **Generic:** `success`, `error`, `loading`, `saved`

## Características do Toast

### Design
- **Border-left colorido** (4px) para identificar rapidamente o tipo
- **Backdrop blur** para efeito glassmorphism
- **Ícones automáticos** baseados na variante
- **Animações suaves** de entrada/saída
- **Dark mode suportado**

### Comportamento
- **Posição:** Canto inferior direito (desktop) / Topo (mobile)
- **Duração:** 5 segundos (padrão)
- **Swipe to dismiss:** Deslizar para fechar
- **Auto-close:** Fecha automaticamente
- **Empilhamento:** Múltiplos toasts se organizam verticalmente

### Acessibilidade
- **Anúncio para leitores de tela**
- **Foco gerenciável**
- **Teclado navegável**
- **Alto contraste**

## Boas Práticas

### ✅ Fazer
- Usar a variante correta para cada situação
- Manter títulos curtos (1-4 palavras)
- Descrições claras e objetivas
- Usar helpers para consistência
- Toasts para feedback imediato

### ❌ Evitar
- Toasts para informações críticas (usar Dialog)
- Múltiplos toasts simultâneos (agrupar)
- Descrições muito longas (> 2 linhas)
- Toasts sem título
- Usar `alert()` ou `confirm()`

## Exemplos Completos

### Signup com feedback
```tsx
const onSubmit = async (data: FormData) => {
  setIsLoading(true)

  try {
    const res = await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (!res.ok) throw new Error('Erro ao criar conta')

    toast({
      variant: 'success',
      title: 'Conta criada com sucesso!',
      description: 'Faça login para continuar',
    })

    router.push('/auth/signin')
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Erro ao criar conta',
      description: error.message,
    })
  } finally {
    setIsLoading(false)
  }
}
```

### Match aceito
```tsx
const handleAccept = async () => {
  try {
    await acceptMatch(matchId)

    toast({
      variant: 'success',
      title: 'Match aceito!',
      description: 'Você pode conversar com o cliente agora',
    })
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Erro ao aceitar match',
      description: 'Tente novamente',
    })
  }
}
```

## Customização

Se precisar customizar o toast para um caso específico:

```tsx
toast({
  variant: 'success',
  title: 'Custom Toast',
  description: 'Com ações',
  action: (
    <Button variant="outline" size="sm">
      Desfazer
    </Button>
  ),
})
```

---

**Desenvolvido com ❤️ e Claude Code**
