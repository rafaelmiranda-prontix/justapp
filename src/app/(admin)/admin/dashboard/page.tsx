'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AdminStats } from '@/components/admin/admin-stats'
import { AdminNav } from '@/components/admin/admin-nav'
import {
  Users,
  Scale,
  FileText,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Settings,
  Briefcase,
  CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AdminDashboardPage() {
  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
        <p className="text-muted-foreground">
          Gerencie usuários, advogados e moderação da plataforma
        </p>
      </div>

      <AdminNav />

      <div className="mt-8">
        <AdminStats />
      </div>

      {/* Ações Rápidas */}
      <div className="grid md:grid-cols-3 gap-4 mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestão de Advogados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Aprovar, rejeitar ou suspender advogados
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/advogados">Gerenciar Advogados</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Moderação de Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Revisar e moderar avaliações reportadas
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/avaliacoes">Moderar Avaliações</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestão de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualizar e gerenciar todos os usuários
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/usuarios">Gerenciar Usuários</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Gestão de Casos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Visualizar e gerenciar todos os casos da plataforma
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/casos">Gerenciar Casos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Configurações do Sistema */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Configurações do Sistema</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração do Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Alternar entre modo MVP (polling) e Pusher (WebSocket em tempo real)
              </p>
              <Button asChild variant="default" className="w-full">
                <Link href="/admin/chat-config">Configurar Chat</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Gestão de Planos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Criar, editar e gerenciar planos de assinatura
              </p>
              <Button asChild variant="default" className="w-full">
                <Link href="/admin/planos">Gerenciar Planos</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
