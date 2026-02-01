import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Redirecionar raiz baseado no role
    if (pathname === '/' && token) {
      if (token.role === 'CIDADAO') {
        return NextResponse.redirect(new URL('/cidadao/dashboard', req.url))
      } else if (token.role === 'ADVOGADO') {
        return NextResponse.redirect(new URL('/advogado/dashboard', req.url))
      } else if (token.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    }

    // Proteção de rotas de cidadão
    if (pathname.startsWith('/cidadao')) {
      if (token?.role !== 'CIDADAO') {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    // Proteção de rotas de advogado
    if (pathname.startsWith('/advogado')) {
      if (token?.role !== 'ADVOGADO') {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    // Proteção de rotas de admin
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Páginas públicas
        if (
          pathname.startsWith('/auth') ||
          pathname.startsWith('/signup') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/users') ||
          pathname.startsWith('/api/anonymous') || // Rotas do chat anônimo
          pathname.startsWith('/api/transcribe-audio') || // Transcrição de áudio (chat anônimo)
          pathname.startsWith('/api/health') || // Health check
          pathname.startsWith('/api/test-') || // Rotas de teste
          pathname.startsWith('/_next') ||
          pathname.startsWith('/advogado/') || // Perfil público de advogado
          pathname === '/termos' || // Termos de Uso
          pathname === '/privacidade' || // Política de Privacidade
          pathname.startsWith('/campanha') // Landing page de campanha
        ) {
          return true
        }

        // Raiz é pública, mas será redirecionada se tiver token
        if (pathname === '/') {
          return true
        }

        // Outras rotas precisam de autenticação
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
