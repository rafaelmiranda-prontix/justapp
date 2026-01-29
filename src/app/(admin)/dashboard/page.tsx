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
      </div>
    </div>
  )
}
