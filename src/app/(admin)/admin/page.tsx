import { redirect } from 'next/navigation'

/**
 * Página raiz do admin - redireciona para o dashboard
 */
export default function AdminRootPage() {
  redirect('/admin/dashboard')
}
