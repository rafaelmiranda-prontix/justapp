'use client'

import { DashboardSidebar, NavItem } from '@/components/layout/dashboard-sidebar'
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Star,
  CreditCard,
  User,
  BarChart3,
} from 'lucide-react'

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/advogado/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Casos Recebidos',
    href: '/advogado/casos',
    icon: Briefcase,
  },
  {
    title: 'Conversas',
    href: '/advogado/conversas',
    icon: MessageSquare,
  },
  {
    title: 'Avaliações',
    href: '/advogado/avaliacoes',
    icon: Star,
  },
  {
    title: 'Estatísticas',
    href: '/advogado/estatisticas',
    icon: BarChart3,
  },
  {
    title: 'Assinatura',
    href: '/advogado/assinatura',
    icon: CreditCard,
  },
  {
    title: 'Meu Perfil',
    href: '/advogado/perfil',
    icon: User,
  },
]

export function AdvogadoNav() {
  return <DashboardSidebar items={navItems} variant="indigo" />
}
