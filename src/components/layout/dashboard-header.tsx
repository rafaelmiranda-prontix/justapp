'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Scale, LogOut, User, Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface DashboardHeaderProps {
  mobileNav?: React.ReactNode
}

export function DashboardHeader({ mobileNav }: DashboardHeaderProps) {
  const { data: session } = useSession()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase()
  }

  // Determinar o link do perfil baseado no role
  const getPerfilLink = () => {
    if (session?.user?.role === 'CIDADAO') {
      return '/cidadao/perfil'
    } else if (session?.user?.role === 'ADVOGADO') {
      return '/advogado/perfil'
    } else if (session?.user?.role === 'ADMIN') {
      return '/admin'
    }
    return '/'
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo e Mobile Menu */}
        <div className="flex items-center gap-4">
          {mobileNav && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Menu de Navegação</SheetTitle>
                </SheetHeader>
                {mobileNav}
              </SheetContent>
            </Sheet>
          )}

          <Link href="/" className="flex items-center gap-2 group">
            <img src="/logo-icon.svg" alt="JustApp" className="h-6 w-6" />
            <span className="text-lg font-bold bg-gradient-to-r from-[#001F5C] via-[#0066CC] to-[#00BFBF] bg-clip-text text-transparent">
              JustApp
            </span>
          </Link>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || ''} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
                  {session?.user?.name ? getInitials(session.user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={getPerfilLink()} className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: '/' })}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
