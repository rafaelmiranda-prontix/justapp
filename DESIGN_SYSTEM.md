# JustApp Design System

Design system moderno e elegante com cores extraídas do logo circular do JustApp.

## 🎨 Paleta de Cores

### Cores Principais (do Logo)

Todas as cores são baseadas no logo circular dinâmico:

```css
/* Primary - Deep Blue (logo #0066CC) */
--primary: 207 100% 40%

/* Accent - Cyan/Teal (logo #00BFBF) */
--accent: 180 100% 37%

/* Success - Green (logo #7EE8A9) */
--success: 150 76% 70%

/* Warning - Lime Green (logo #B4F34D) */
--warning: 75 90% 60%

/* Destructive - Vibrant Red */
--destructive: 0 84% 60%

/* Info - Light Blue (logo #00BFFF) */
--info: 195 100% 50%
```

### Gradientes (do Logo Circular)

Gradientes extraídos diretamente dos arcos do logo:

- **Gradient Primary**: `#001F5C → #0066CC → #00BFBF` (Navy → Royal Blue → Cyan)
- **Gradient Accent**: `#00D4D4 → #7EE8A9` (Cyan Claro → Verde)
- **Gradient Success**: `#7EE8A9 → #B4F34D` (Verde → Lima)

## 🎭 Componentes

### Logo

Logo circular moderno com as letras "JA" e arcos dinâmicos em gradiente:

```tsx
import { Logo } from '@/components/ui/logo'

// Diferentes variantes
<Logo variant="default" size="md" />
<Logo variant="icon" size="sm" showText={false} />
<Logo variant="horizontal" size="lg" />
<Logo variant="dark" size="md" /> // Para fundo escuro
```

**Tamanhos disponíveis**: `sm`, `md`, `lg`

### Buttons

Botões modernos com bordas arredondadas e animações suaves:

```tsx
import { Button } from '@/components/ui/button'

// Variantes
<Button variant="default">Default</Button>
<Button variant="gradient">Gradient</Button> // ⭐ Novo
<Button variant="success">Success</Button> // ⭐ Novo
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Destructive</Button>

// Tamanhos
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
```

### Cards

Cards com sombras suaves e bordas arredondadas:

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    Conteúdo do card
  </CardContent>
</Card>

// Card com efeito glass
<Card className="glass">...</Card>

// Card com borda destacada
<Card className="border-primary/20">...</Card>
```

### Gradient Badge

Badges com gradientes vibrantes:

```tsx
import { GradientBadge } from '@/components/ui/gradient-badge'

<GradientBadge variant="primary">Primary</GradientBadge>
<GradientBadge variant="accent">Accent</GradientBadge>
<GradientBadge variant="success">Success</GradientBadge>
<GradientBadge variant="gradient">Animated</GradientBadge>
```

### Status Pill

Indicadores de status modernos com ícones:

```tsx
import { StatusPill } from '@/components/ui/status-pill'
import { Clock, CheckCircle2 } from 'lucide-react'

<StatusPill variant="pending">
  <Clock className="h-3 w-3" />
  Pendente
</StatusPill>

<StatusPill variant="active">
  <CheckCircle2 className="h-3 w-3" />
  Ativo
</StatusPill>

// Variantes: pending, active, accepted, rejected, completed, default
```

## 🎨 Classes Utilitárias

### Gradientes

```tsx
// Background gradients
<div className="gradient-primary" />
<div className="gradient-accent" />
<div className="gradient-success" />
<div className="bg-gradient-animated" /> // Gradiente animado

// Text gradients
<h1 className="gradient-text-primary">Título com Gradiente</h1>
```

### Glassmorphism

```tsx
// Light mode
<div className="glass">Conteúdo com efeito vidro</div>

// Dark mode
<div className="glass-dark">Conteúdo com efeito vidro</div>
```

### Sombras Suaves

```tsx
<div className="shadow-soft" /> // Sombra suave
<div className="shadow-soft-lg" /> // Sombra suave grande
```

### Grid Pattern

```tsx
<div className="bg-grid-pattern">Fundo com padrão de grid</div>
```

## 🎯 Border Radius

O design system usa bordas mais arredondadas (Monday.com style):

```css
--radius: 0.75rem; /* 12px */
```

Aplicado automaticamente em:
- `rounded-lg`: 0.75rem
- `rounded-md`: 0.625rem
- `rounded-sm`: 0.5rem

## 📐 Tipografia

### Pesos de Fonte

- **Bold**: 700 - Para títulos principais
- **Semibold**: 600 - Para botões e subtítulos
- **Medium**: 500 - Para labels
- **Regular**: 400 - Para texto corpo

### Tamanhos

```tsx
<h1 className="text-4xl font-bold">Heading 1</h1>
<h2 className="text-3xl font-bold">Heading 2</h2>
<h3 className="text-2xl font-bold">Heading 3</h3>
<h4 className="text-xl font-semibold">Heading 4</h4>
<p className="text-base">Parágrafo</p>
<span className="text-sm text-muted-foreground">Texto secundário</span>
```

## 🌓 Dark Mode

Todas as cores têm variantes otimizadas para dark mode, com cores mais brilhantes para melhor contraste:

```css
.dark {
  --primary: 263 70% 60%; /* Mais brilhante */
  --accent: 346 75% 55%;
  /* ... */
}
```

## 🎨 Página de Demonstração

Acesse `/admin/design-system` para ver todos os componentes e cores do design system em ação.

## 📦 Arquivos do Design System

### CSS
- `src/app/globals.css` - Variáveis de cores e utilitários

### Componentes
- `src/components/ui/logo.tsx` - Componente de logo
- `src/components/ui/button.tsx` - Botões
- `src/components/ui/card.tsx` - Cards
- `src/components/ui/gradient-badge.tsx` - Badges com gradiente
- `src/components/ui/status-pill.tsx` - Pills de status

### Assets
- `public/logo.svg` - Logo principal
- `public/logo-icon.svg` - Ícone isolado
- `public/logo-horizontal.svg` - Logo horizontal
- `public/logo-dark.svg` - Logo para dark mode

## 🚀 Uso Rápido

### Criar um card destacado

```tsx
<Card className="border-primary/20">
  <CardHeader>
    <CardTitle className="gradient-text-primary">Título Destacado</CardTitle>
    <CardDescription>Descrição do card</CardDescription>
  </CardHeader>
  <CardContent>
    <Button variant="gradient">
      <Send className="mr-2 h-4 w-4" />
      Ação Principal
    </Button>
  </CardContent>
</Card>
```

### Criar badges de status

```tsx
<div className="flex gap-2">
  <StatusPill variant="pending">Aguardando</StatusPill>
  <StatusPill variant="active">Em Andamento</StatusPill>
  <StatusPill variant="completed">Concluído</StatusPill>
</div>
```

### Criar botão com gradiente

```tsx
<Button variant="gradient" size="lg">
  <Star className="mr-2 h-5 w-5" />
  Botão Destacado
</Button>
```

## 🎯 Princípios do Design

1. **Vibrante e Moderno**: Uso de gradientes e cores vibrantes
2. **Bordas Arredondadas**: Border radius generoso (12px)
3. **Sombras Suaves**: Sombras sutis com baixa opacidade
4. **Transições Suaves**: Animações de 200ms para todas as interações
5. **Hierarquia Clara**: Tipografia bem definida com pesos variados
6. **Acessibilidade**: Contraste adequado em light e dark mode

## 📱 Responsividade

Todos os componentes são responsivos e funcionam bem em mobile, tablet e desktop.

## 🔄 Migração

Para migrar componentes existentes:

1. Substitua `rounded-md` por `rounded-lg` para bordas mais arredondadas
2. Adicione `shadow-soft` em cards para sombras suaves
3. Use `gradient-text-primary` para títulos destacados
4. Substitua badges simples por `GradientBadge` ou `StatusPill`
5. Use `variant="gradient"` em botões de ação principal

---

**JustApp** - Conectando cidadãos e advogados de forma moderna e eficiente.
