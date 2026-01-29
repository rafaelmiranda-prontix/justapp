import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id

        // Buscar informações adicionais do usuário
        const userWithRole = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            cidadao: true,
            advogado: true,
          },
        })

        if (userWithRole) {
          session.user.role = userWithRole.role
          session.user.cidadaoId = userWithRole.cidadao?.id
          session.user.advogadoId = userWithRole.advogado?.id
        }
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
  },
}
