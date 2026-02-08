import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

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
    async signIn({ user, account, profile }) {
      // Se for login com Google
      if (account?.provider === 'google' && user.email) {
        try {
          // Buscar usuário existente
          let dbUser = await prisma.users.findUnique({
            where: { email: user.email },
            include: {
              cidadaos: true,
              advogados: true,
            },
          })

          // Se não existir, criar como CIDADAO por padrão
          if (!dbUser) {
            const userId = nanoid()
            const cidadaoId = nanoid()
            const now = new Date()
            
            await prisma.users.create({
              data: {
                id: userId,
                email: user.email,
                name: user.name || 'Usuário',
                image: user.image || null,
                emailVerified: now,
                role: 'CIDADAO',
                status: 'ACTIVE',
                updatedAt: now,
                cidadaos: {
                  create: {
                    id: cidadaoId,
                    // cidade e estado vazios - usuário precisará completar
                    updatedAt: now,
                  },
                },
              },
            })

            // Buscar o usuário criado com includes
            dbUser = await prisma.users.findUnique({
              where: { id: userId },
              include: {
                cidadaos: true,
                advogados: true,
              },
            })

            if (!dbUser) {
              console.error('Failed to create user')
              return false
            }
          }

          // Atualizar dados do usuário com dados do banco
          if (dbUser) {
            user.id = dbUser.id
            user.role = dbUser.role
            user.cidadaoId = dbUser.cidadaos?.id
            user.advogadoId = dbUser.advogados?.id
          }

          return true
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }

      // Para login com credenciais, já está tratado no authorize
      return true
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in - usar dados do user se disponível
      if (user) {
        token.id = user.id
        token.email = user.email ?? undefined
        token.name = user.name ?? undefined
        token.role = user.role
        token.cidadaoId = user.cidadaoId
        token.advogadoId = user.advogadoId
      }

      // Se não tiver role no token, buscar do banco
      if (token.email && !token.role) {
        try {
          const dbUser = await prisma.users.findUnique({
            where: { email: token.email },
            include: {
              cidadaos: true,
              advogados: true,
            },
          })

          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.cidadaoId = dbUser.cidadaos?.id
            token.advogadoId = dbUser.advogados?.id
          }
        } catch (error) {
          console.error('Error fetching user in jwt callback:', error)
        }
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
    async redirect({ url, baseUrl }) {
      // Se a URL for relativa, usar baseUrl
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Se a URL for do mesmo domínio, permitir
      if (new URL(url).origin === baseUrl) return url
      // Caso contrário, redirecionar para home (middleware vai redirecionar baseado no role)
      return baseUrl
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
