'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarDays, ListChecks, Search, UserCog, PlusCircle } from 'lucide-react'

export default function AudienciasDiligenciasHomePage() {
  return (
    <div className="container max-w-3xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-indigo-600" />
          Audiências e diligências
        </h1>
        <p className="text-muted-foreground mt-1">
          Publique demandas operacionais ou atue como correspondente em outras regiões.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Solicitante
            </CardTitle>
            <CardDescription>Publicar audiência, diligência ou protocolo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild>
              <Link href="/advogado/audiencias-diligencias/publicar">Nova publicação</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/advogado/audiencias-diligencias/historico?role=solicitor">Minhas publicações</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Correspondente
            </CardTitle>
            <CardDescription>Ver oportunidades e gerenciar perfil.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="secondary">
              <Link href="/advogado/audiencias-diligencias/oportunidades">Oportunidades abertas</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/advogado/audiencias-diligencias/historico?role=correspondent">Serviços aceitos</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/advogado/audiencias-diligencias/correspondente">
                <UserCog className="h-4 w-4 mr-2" />
                Meu perfil de correspondente
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Fluxo
          </CardTitle>
          <CardDescription>
            Ative seu perfil de correspondente, defina regiões e tipos aceitos. Depois de aceitar um
            serviço, use o chat interno, atualize o status e anexe evidências quando concluir.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
