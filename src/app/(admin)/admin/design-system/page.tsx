'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { GradientBadge } from '@/components/ui/gradient-badge'
import { StatusPill } from '@/components/ui/status-pill'
import { Badge } from '@/components/ui/badge'
import {
  Heart,
  Star,
  MessageCircle,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'

export default function DesignSystemPage() {
  return (
    <div className="container mx-auto py-10 space-y-10">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <h1 className="text-5xl font-bold gradient-text-primary">JustApp Design System</h1>
        <p className="text-xl text-muted-foreground">
          Visual moderno e elegante inspirado no Monday.com
        </p>
      </div>

      {/* Cores */}
      <Card>
        <CardHeader>
          <CardTitle>Paleta de Cores</CardTitle>
          <CardDescription>Cores vibrantes e modernas com gradientes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-24 rounded-lg gradient-primary" />
              <p className="text-sm font-medium">Primary Gradient</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg gradient-accent" />
              <p className="text-sm font-medium">Accent Gradient</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg gradient-success" />
              <p className="text-sm font-medium">Success Gradient</p>
            </div>
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-gradient-animated" />
              <p className="text-sm font-medium">Animated Gradient</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-primary" />
              <p className="text-xs">Primary</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-accent" />
              <p className="text-xs">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-success" />
              <p className="text-xs">Success</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-warning" />
              <p className="text-xs">Warning</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-destructive" />
              <p className="text-xs">Destructive</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
      <Card>
        <CardHeader>
          <CardTitle>Botões</CardTitle>
          <CardDescription>Diferentes variantes e tamanhos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button variant="default">Default</Button>
            <Button variant="gradient">Gradient</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="success">Success</Button>
            <Button variant="destructive">Destructive</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" variant="gradient">
              Small
            </Button>
            <Button size="default" variant="gradient">
              Default
            </Button>
            <Button size="lg" variant="gradient">
              Large
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="gradient">
              <Send className="mr-2 h-4 w-4" />
              Com Ícone
            </Button>
            <Button variant="outline">
              <Heart className="mr-2 h-4 w-4" />
              Favoritar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Badges e Pills */}
      <Card>
        <CardHeader>
          <CardTitle>Badges e Status Pills</CardTitle>
          <CardDescription>Indicadores visuais modernos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-3">Gradient Badges</h4>
            <div className="flex flex-wrap gap-2">
              <GradientBadge variant="primary">Primary</GradientBadge>
              <GradientBadge variant="accent">Accent</GradientBadge>
              <GradientBadge variant="success">Success</GradientBadge>
              <GradientBadge variant="gradient">Animated</GradientBadge>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Status Pills</h4>
            <div className="flex flex-wrap gap-2">
              <StatusPill variant="pending">
                <Clock className="h-3 w-3" />
                Pendente
              </StatusPill>
              <StatusPill variant="active">
                <CheckCircle2 className="h-3 w-3" />
                Ativo
              </StatusPill>
              <StatusPill variant="accepted">
                <Star className="h-3 w-3" />
                Aceito
              </StatusPill>
              <StatusPill variant="rejected">
                <XCircle className="h-3 w-3" />
                Rejeitado
              </StatusPill>
              <StatusPill variant="completed">
                <CheckCircle2 className="h-3 w-3" />
                Completo
              </StatusPill>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Badge Padrão</h4>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Card Simples</CardTitle>
            <CardDescription>Card com sombra suave</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cards modernos com bordas arredondadas e sombras suaves inspiradas no Monday.com.
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="gradient-text-primary">Card com Destaque</CardTitle>
            <CardDescription>Com borda colorida</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Adicione destaque visual com bordas coloridas e títulos com gradiente.
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Card Glass</CardTitle>
            <CardDescription>Efeito glassmorphism</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Efeito de vidro moderno com blur e transparência.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logos */}
      <Card>
        <CardHeader>
          <CardTitle>Logos</CardTitle>
          <CardDescription>Diferentes variantes e tamanhos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-8">
            <Logo size="sm" />
            <Logo size="md" />
            <Logo size="lg" />
          </div>

          <div className="flex flex-wrap items-center gap-8">
            <Logo variant="icon" size="sm" showText={false} />
            <Logo variant="icon" size="md" showText={false} />
            <Logo variant="icon" size="lg" showText={false} />
          </div>

          <div className="bg-slate-900 p-8 rounded-lg">
            <Logo variant="dark" />
          </div>
        </CardContent>
      </Card>

      {/* Tipografia */}
      <Card>
        <CardHeader>
          <CardTitle>Tipografia</CardTitle>
          <CardDescription>Hierarquia visual e estilos de texto</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h1 className="text-4xl font-bold">Heading 1</h1>
          <h2 className="text-3xl font-bold">Heading 2</h2>
          <h3 className="text-2xl font-bold">Heading 3</h3>
          <h4 className="text-xl font-semibold">Heading 4</h4>
          <p className="text-base">Parágrafo padrão com texto normal</p>
          <p className="text-sm text-muted-foreground">
            Texto secundário em tamanho menor e cor suave
          </p>
          <p className="text-lg gradient-text-primary font-bold">
            Texto com gradiente colorido
          </p>
        </CardContent>
      </Card>

      {/* Ícones */}
      <Card>
        <CardHeader>
          <CardTitle>Ícones</CardTitle>
          <CardDescription>Lucide icons com cores do tema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs">Heart</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-lg gradient-accent flex items-center justify-center">
                <Star className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs">Star</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-lg gradient-success flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs">Check</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs">Message</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-lg bg-warning flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs">Alert</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
