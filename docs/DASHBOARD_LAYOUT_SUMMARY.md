# Dashboard Layouts - LegalConnect

## 📋 Resumo da Implementação

Implementação completa dos layouts de dashboard para Cidadão e Advogado, seguindo o design system com gradientes azul/indigo e componentes reutilizáveis.

## 🎨 Design System

### Cores e Gradientes
- **Cidadão**: Gradiente azul (`from-blue-600 to-blue-500`)
- **Advogado**: Gradiente índigo (`from-indigo-600 to-indigo-500`)
- **Background**: Gradiente suave (`from-slate-50 via-[color]-50/30 to-slate-50`)

### Componentes Criados

#### 1. DashboardHeader (`src/components/layout/dashboard-header.tsx`)
- Header fixo no topo com backdrop blur
- Logo com gradiente animado
- Avatar do usuário com dropdown menu
- Menu mobile responsivo (Sheet/Drawer)
- Integração com NextAuth para logout

**Funcionalidades:**
- ✅ Dropdown com perfil do usuário
- ✅ Links para Perfil e Configurações
- ✅ Botão de logout com confirmação
- ✅ Menu hamburger para mobile
- ✅ Logo com link para home

#### 2. DashboardSidebar (`src/components/layout/dashboard-sidebar.tsx`)
- Sidebar lateral para desktop (hidden em mobile)
- Itens de navegação com ícones
- Destaque visual para rota ativa (gradiente)
- Suporte a badges para notificações
- Transições suaves e hover effects

**Funcionalidades:**
- ✅ Destaque de rota ativa com gradiente
- ✅ Ícones lucide-react
- ✅ Badges opcionais para contadores
- ✅ Variantes de cor (blue/indigo)
- ✅ Animações no hover

#### 3. CidadaoNav (`src/components/cidadao/cidadao-nav.tsx`)
Navegação específica para cidadãos:
- 📊 Dashboard
- 📄 Meus Casos
- 🔍 Buscar Advogados
- 💬 Conversas
- ⭐ Avaliações
- 👤 Meu Perfil

#### 4. AdvogadoNav (`src/components/advogado/advogado-nav.tsx`)
Navegação específica para advogados:
- 📊 Dashboard
- 💼 Casos Recebidos
- 💬 Conversas
- ⭐ Avaliações
- 📈 Estatísticas
- 💳 Assinatura
- 👤 Meu Perfil

### Componentes UI Adicionados

#### DropdownMenu (`src/components/ui/dropdown-menu.tsx`)
- Componente Radix UI para menus dropdown
- Usado no avatar do usuário no header
- Animações de entrada/saída

#### Sheet (`src/components/ui/sheet.tsx`)
- Componente Radix UI para drawers/sheets
- Usado para navegação mobile
- Suporta 4 direções (left, right, top, bottom)

## 📱 Responsividade

### Desktop (lg+)
- Sidebar visível permanentemente
- Header completo com logo e avatar
- Layout em 2 colunas (sidebar + conteúdo)

### Mobile (< lg)
- Sidebar oculta
- Menu hamburger no header
- Sheet/Drawer para navegação
- Layout em coluna única

## 🎯 Estrutura de Arquivos

```
src/
├── components/
│   ├── layout/
│   │   ├── dashboard-header.tsx      # Header compartilhado
│   │   └── dashboard-sidebar.tsx     # Sidebar reutilizável
│   ├── cidadao/
│   │   └── cidadao-nav.tsx          # Nav específico cidadão
│   ├── advogado/
│   │   └── advogado-nav.tsx         # Nav específico advogado
│   └── ui/
│       ├── dropdown-menu.tsx        # Dropdown Radix
│       └── sheet.tsx                # Sheet/Drawer Radix
└── app/
    ├── (cidadao)/
    │   └── layout.tsx               # Layout cidadão
    └── (advogado)/
        └── layout.tsx               # Layout advogado
```

## 🔄 Reutilização de Componentes

### Como usar em outras áreas:

```tsx
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardSidebar, NavItem } from '@/components/layout/dashboard-sidebar'

const myNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    badge: '5', // opcional
  },
]

export default function MyLayout({ children }) {
  return (
    <div>
      <DashboardHeader mobileNav={<DashboardSidebar items={myNavItems} variant="blue" />} />
      <div className="flex">
        <DashboardSidebar items={myNavItems} variant="indigo" />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
```

## ✨ Funcionalidades Implementadas

- ✅ Header fixo com backdrop blur
- ✅ Sidebar responsiva com gradientes
- ✅ Menu mobile com Sheet/Drawer
- ✅ Dropdown do usuário com avatar
- ✅ Destaque de rota ativa
- ✅ Animações suaves
- ✅ Logout integrado com NextAuth
- ✅ Design system consistente
- ✅ Componentes totalmente reutilizáveis
- ✅ TypeScript com tipos completos
- ✅ Ícones lucide-react

## 🎨 Customização

### Adicionar novo item de navegação:

```tsx
// Em cidadao-nav.tsx ou advogado-nav.tsx
const navItems: NavItem[] = [
  // ... itens existentes
  {
    title: 'Nova Seção',
    href: '/path',
    icon: IconFromLucide,
    badge: '10', // opcional
  },
]
```

### Alterar cores do gradiente:

```tsx
// Em DashboardSidebar, adicionar nova variant:
const gradientClasses = {
  blue: 'from-blue-600 to-blue-500',
  indigo: 'from-indigo-600 to-indigo-500',
  green: 'from-green-600 to-green-500', // nova
}
```

## 🚀 Próximos Passos

Para completar a experiência:
1. Implementar as páginas referenciadas na navegação
2. Adicionar notificações/badges dinâmicos
3. Implementar breadcrumbs opcionais
4. Adicionar barra de progresso no top (opcional)
5. Implementar tema dark mode (opcional)

---

**Status**: ✅ Implementação Completa
**Data**: 30/01/2026
**Tecnologias**: Next.js 15, React 18, Tailwind CSS, Radix UI, TypeScript
