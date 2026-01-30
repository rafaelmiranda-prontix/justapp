'use client'

import { DashboardSidebar, NavItem } from '@/components/layout/dashboard-sidebar'
import {
  LayoutDashboard,
  FileText,
  Search,
  MessageSquare,
  Star,
  User,
} from 'lucide-react'

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/cidadao/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Meus Casos',
    href: '/cidadao/casos',
    icon: FileText,
  },
  {
    title: 'Buscar Advogados',
    href: '/cidadao/buscar',
    icon: Search,
  },
  {
    title: 'Conversas',
    href: '/cidadao/conversas',
    icon: MessageSquare,
  },
  {
    title: 'Avaliações',
    href: '/cidadao/avaliacoes',
    icon: Star,
  },
  {
    title: 'Meu Perfil',
    href: '/cidadao/perfil',
    icon: User,
  },
]

export function CidadaoNav() {
  return <DashboardSidebar items={navItems} variant="blue" />
}
