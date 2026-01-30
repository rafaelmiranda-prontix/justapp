/**
 * Helper functions para toasts elegantes
 * Facilitam o uso de toasts com padrões consistentes
 */

type ToastFunction = (props: {
  title?: string
  description?: string
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info'
}) => void

interface ToastHelpers {
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

export function createToastHelpers(toast: ToastFunction): ToastHelpers {
  return {
    success: (title: string, description?: string) => {
      toast({
        variant: 'success',
        title,
        description,
      })
    },
    error: (title: string, description?: string) => {
      toast({
        variant: 'destructive',
        title,
        description,
      })
    },
    warning: (title: string, description?: string) => {
      toast({
        variant: 'warning',
        title,
        description,
      })
    },
    info: (title: string, description?: string) => {
      toast({
        variant: 'info',
        title,
        description,
      })
    },
  }
}

// Mensagens pré-configuradas comuns
export const toastMessages = {
  auth: {
    loginSuccess: {
      variant: 'success' as const,
      title: 'Login realizado com sucesso!',
      description: 'Redirecionando...',
    },
    loginError: {
      variant: 'destructive' as const,
      title: 'Erro ao fazer login',
      description: 'Email ou senha inválidos',
    },
    signupSuccess: {
      variant: 'success' as const,
      title: 'Conta criada com sucesso!',
      description: 'Faça login para continuar',
    },
    signupError: {
      variant: 'destructive' as const,
      title: 'Erro ao criar conta',
      description: 'Tente novamente mais tarde',
    },
    logoutSuccess: {
      variant: 'info' as const,
      title: 'Logout realizado',
      description: 'Até logo!',
    },
  },
  match: {
    accepted: {
      variant: 'success' as const,
      title: 'Caso aceito!',
      description: 'Você pode conversar com o cliente agora',
    },
    rejected: {
      variant: 'info' as const,
      title: 'Caso recusado',
      description: 'O caso foi removido da sua lista',
    },
  },
  message: {
    sent: {
      variant: 'success' as const,
      title: 'Mensagem enviada',
      description: null,
    },
    error: {
      variant: 'destructive' as const,
      title: 'Erro ao enviar mensagem',
      description: 'Tente novamente',
    },
  },
  subscription: {
    success: {
      variant: 'success' as const,
      title: 'Assinatura ativada!',
      description: 'Você já pode receber mais leads',
    },
    canceled: {
      variant: 'warning' as const,
      title: 'Assinatura cancelada',
      description: 'Você voltará ao plano gratuito',
    },
    error: {
      variant: 'destructive' as const,
      title: 'Erro ao processar assinatura',
      description: 'Entre em contato com o suporte',
    },
  },
  generic: {
    success: {
      variant: 'success' as const,
      title: 'Sucesso!',
      description: 'Operação realizada com sucesso',
    },
    error: {
      variant: 'destructive' as const,
      title: 'Erro',
      description: 'Algo deu errado. Tente novamente',
    },
    loading: {
      variant: 'info' as const,
      title: 'Processando...',
      description: 'Aguarde um momento',
    },
    saved: {
      variant: 'success' as const,
      title: 'Salvo!',
      description: 'Suas alterações foram salvas',
    },
  },
}
