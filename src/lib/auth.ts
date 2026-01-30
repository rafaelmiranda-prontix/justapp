import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios')
        }

        const user = await prisma.users.findUnique({
          where: { email: credentials.email },
          include: {
            cidadaos: true,
            advogados: true,
          },
        })

        if (!user || !user.password) {
          throw new Error('Email ou senha inválidos')
        }

        // Verificar se a conta está ativa
        if (user.status === 'PRE_ACTIVE') {
          throw new Error('Sua conta ainda não foi ativada. Verifique seu email e clique no link de ativação.')
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('Sua conta está suspensa ou inativa. Entre em contato com o suporte.')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Email ou senha inválidos')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          cidadaoId: user.cidadaos?.id,
          advogadoId: user.advogados?.id,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email ?? undefined
        token.name = user.name ?? undefined
        token.role = user.role
        token.cidadaoId = user.cidadaoId
        token.advogadoId = user.advogadoId
      }

      // Update session
      if (trigger === 'update' && session) {
        return { ...token, ...session.user }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.role = token.role
        session.user.cidadaoId = token.cidadaoId
        session.user.advogadoId = token.advogadoId
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}
