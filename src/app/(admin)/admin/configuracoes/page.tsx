'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { AdminNav } from '@/components/admin/admin-nav'
import { useToast } from '@/hooks/use-toast'
import { JustAppLoading } from '@/components/ui/justapp-loading'
import { Save, RefreshCw, Cog } from 'lucide-react'

interface Configuracao {
  id: string
  chave: string
  valor: string
  tipo: 'STRING' | 'NUMBER' | 'BOOLEAN'
  descricao: string | null
  categoria: string | null
  createdAt: string
  updatedAt: string
}

const categoriaLabels: Record<string, string> = {
  matching: 'Matching e Distribuição',
  chat: 'Chat e Mensagens',
  leads: 'Leads e Limites',
  sistema: 'Sistema Geral',
  outros: 'Outros',
}

export default function ConfiguracoesPage() {
  const [configuracoes, setConfiguracoes] = useState<Configuracao[]>([])
  const [configuracoesPorCategoria, setConfiguracoesPorCategoria] = useState<
    Record<string, Configuracao[]>
  >({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchConfiguracoes()
  }, [])

  const fetchConfiguracoes = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/configuracoes')
      const result = await res.json()

      if (result.success) {
        setConfiguracoes(result.data.configuracoes)
        setConfiguracoesPorCategoria(result.data.porCategoria)
        
        // Inicializar valores editados
        const valores: Record<string, string> = {}
        result.data.configuracoes.forEach((config: Configuracao) => {
          valores[config.chave] = config.valor
        })
        setEditedValues(valores)
      }
    } catch (error) {
      console.error('Error fetching configuracoes:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configurações',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleValueChange = (chave: string, valor: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [chave]: valor,
    }))
  }

  const handleSave = async (chave: string) => {
    setIsSaving(true)
    try {
      const config = configuracoes.find((c) => c.chave === chave)
      if (!config) return

      let valorFinal: string | number | boolean = editedValues[chave]

      // Converter valor baseado no tipo
      if (config.tipo === 'NUMBER') {
        valorFinal = Number(valorFinal)
        if (isNaN(valorFinal)) {
          toast({
            title: 'Erro',
            description: 'Valor deve ser um número',
            variant: 'destructive',
          })
          return
        }
      } else if (config.tipo === 'BOOLEAN') {
        valorFinal = valorFinal === 'true' || valorFinal === '1'
      }

      const res = await fetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chave,
          valor: valorFinal,
        }),
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Configuração atualizada com sucesso',
        })
        fetchConfiguracoes() // Recarregar para pegar valores atualizados
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao atualizar configuração',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving configuracao:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configuração',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderConfigInput = (config: Configuracao) => {
    const valorAtual = editedValues[config.chave] || config.valor

    if (config.tipo === 'BOOLEAN') {
      const isChecked = valorAtual === 'true' || valorAtual === '1'
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`config-${config.chave}`}
            checked={isChecked}
            onCheckedChange={(checked) => handleValueChange(config.chave, checked ? 'true' : 'false')}
          />
          <Label htmlFor={`config-${config.chave}`} className="text-sm text-muted-foreground cursor-pointer">
            {isChecked ? 'Ativado' : 'Desativado'}
          </Label>
        </div>
      )
    }

    if (config.tipo === 'NUMBER') {
      return (
        <Input
          type="number"
          value={valorAtual}
          onChange={(e) => handleValueChange(config.chave, e.target.value)}
          className="max-w-xs"
        />
      )
    }

    // STRING
    return (
      <Input
        type="text"
        value={valorAtual}
        onChange={(e) => handleValueChange(config.chave, e.target.value)}
        className="max-w-md"
      />
    )
  }

  if (isLoading) {
    return (
      <div className="container max-w-7xl py-8">
        <JustAppLoading text="Carregando configurações..." fullScreen={false} />
      </div>
    )
  }

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Cog className="h-8 w-8" />
          Configurações do Sistema
        </h1>
        <p className="text-muted-foreground">
          Gerencie as configurações globais da plataforma
        </p>
      </div>

      <AdminNav />

      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {configuracoes.length} configuração(ões) disponível(is)
          </p>
          <Button variant="outline" onClick={fetchConfiguracoes} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {Object.keys(configuracoesPorCategoria).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma configuração encontrada
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(configuracoesPorCategoria).map(([categoria, configs]) => (
              <Card key={categoria}>
                <CardHeader>
                  <CardTitle>{categoriaLabels[categoria] || categoria}</CardTitle>
                  <CardDescription>
                    {configs.length} configuração(ões) nesta categoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {configs.map((config) => {
                      const valorAtual = editedValues[config.chave] || config.valor
                      const hasChanges = valorAtual !== config.valor

                      return (
                        <div
                          key={config.id}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border rounded-lg"
                        >
                          <div className="flex-1">
                            <Label className="text-base font-semibold">{config.chave}</Label>
                            {config.descricao && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {config.descricao}
                              </p>
                            )}
                            <div className="mt-3">{renderConfigInput(config)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasChanges && (
                              <span className="text-xs text-muted-foreground">Modificado</span>
                            )}
                            <Button
                              onClick={() => handleSave(config.chave)}
                              disabled={isSaving || !hasChanges}
                              size="sm"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Salvar
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
