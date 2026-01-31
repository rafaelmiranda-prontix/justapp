'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, AlertCircle, Zap, Clock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ChatMode {
  value: string
  label: string
  description: string
  recommended: boolean
  requiresConfig?: boolean
}

interface ChatConfig {
  currentMode: string
  pusherConfigured: boolean
  availableModes: ChatMode[]
}

export default function ChatConfigPage() {
  const [config, setConfig] = useState<ChatConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/chat-config')
      const result = await res.json()

      if (result.success) {
        setConfig(result.data)
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao carregar configuração',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configuração',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = async (mode: string) => {
    setIsSwitching(true)

    try {
      const res = await fetch('/api/admin/chat-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: result.message,
        })
        fetchConfig()
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao alterar modo',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error switching mode:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao alterar modo',
        variant: 'destructive',
      })
    } finally {
      setIsSwitching(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Erro ao carregar configurações</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configuração do Chat</h1>
        <p className="text-muted-foreground">
          Escolha o modo de funcionamento do sistema de chat entre cidadãos e advogados
        </p>
      </div>

      {/* Status Atual */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Status Atual</CardTitle>
          <CardDescription>Modo de chat ativo no momento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-sm px-3 py-1">
              {config.currentMode}
            </Badge>
            {config.currentMode === 'PUSHER' && config.pusherConfigured && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Zap className="h-3 w-3 mr-1" />
                WebSocket Ativo
              </Badge>
            )}
            {config.currentMode === 'MVP' && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <Clock className="h-3 w-3 mr-1" />
                Polling Otimizado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Alerta Pusher não configurado */}
      {!config.pusherConfigured && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Pusher não está configurado. Para usar o modo WebSocket, adicione as credenciais do Pusher
            no arquivo .env. Veja o guia em CHAT_OPTIMIZATION_GUIDE.md
          </AlertDescription>
        </Alert>
      )}

      {/* Modos Disponíveis */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Modos Disponíveis</h2>

        {config.availableModes.map((mode) => {
          const isActive = mode.value === config.currentMode
          const canActivate = !mode.requiresConfig

          return (
            <Card key={mode.value} className={isActive ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {mode.label}
                      {isActive && (
                        <Badge variant="default" className="ml-2">
                          <Check className="h-3 w-3 mr-1" />
                          Ativo
                        </Badge>
                      )}
                      {mode.recommended && !isActive && (
                        <Badge variant="secondary" className="ml-2">
                          Recomendado
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">{mode.description}</CardDescription>
                  </div>

                  {!isActive && (
                    <Button
                      onClick={() => switchMode(mode.value)}
                      disabled={!canActivate || isSwitching}
                      variant={mode.recommended ? 'default' : 'outline'}
                    >
                      {isSwitching ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Alterando...
                        </>
                      ) : (
                        'Ativar'
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                <div className="text-sm space-y-2">
                  {mode.value === 'MVP' && (
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>✅ Sem dependências externas</li>
                      <li>✅ Polling otimizado a cada 5s (busca apenas novas mensagens)</li>
                      <li>✅ Paginação para histórico grande</li>
                      <li>✅ React.memo para evitar re-renders</li>
                      <li>⚠️ Latência de até 5 segundos</li>
                    </ul>
                  )}

                  {mode.value === 'PUSHER' && (
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>✅ Mensagens instantâneas (WebSocket)</li>
                      <li>✅ Indicador de &quot;digitando...&quot;</li>
                      <li>✅ Marcação de lidas em tempo real</li>
                      <li>✅ 90% menos requisições ao servidor</li>
                      <li>
                        {config.pusherConfigured ? (
                          <span className="text-green-600">✅ Pusher configurado</span>
                        ) : (
                          <span className="text-orange-600">⚠️ Requer configuração do Pusher</span>
                        )}
                      </li>
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Informações Adicionais */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • A mudança de modo afeta <strong>TODOS</strong> os chats da plataforma imediatamente
          </p>
          <p>
            • Modo MVP é recomendado para desenvolvimento e para produção sem Pusher configurado
          </p>
          <p>
            • Modo Pusher oferece melhor experiência mas requer conta no pusher.com (gratuito até 200k
            mensagens/dia)
          </p>
          <p>
            • Consulte <code>CHAT_OPTIMIZATION_GUIDE.md</code> para instruções detalhadas
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
