import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getChatAttachmentFile } from '@/lib/supabase-storage'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/chat/attachments/[path]
 * BFF autenticado para servir arquivos anexos
 * Verifica autenticação e permissões antes de servir o arquivo
 * 
 * Path format: {matchId}/{userId}/{timestamp}-{randomId}.{ext}
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { path } = await params

    // Extrair matchId do path (formato: matchId/userId/timestamp-randomId.ext)
    const pathParts = path.split('/')
    if (pathParts.length < 2) {
      return NextResponse.json({ error: 'Path inválido' }, { status: 400 })
    }

    const matchId = pathParts[0]

    // Verificar se o usuário tem acesso a este match
    const match = await prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        casos: {
          include: {
            cidadaos: {
              include: {
                users: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        advogados: {
          include: {
            users: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    if (!match) {
      return NextResponse.json({ error: 'Match não encontrado' }, { status: 404 })
    }

    // Verificar se o usuário é participante do match
    const isCidadao = match.casos.cidadaos.users.id === session.user.id
    const isAdvogado = match.advogados.users.id === session.user.id

    if (!isCidadao && !isAdvogado) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar este anexo' },
        { status: 403 }
      )
    }

    // Buscar o arquivo do Supabase Storage
    const fileResult = await getChatAttachmentFile(path)

    if (!fileResult.success || !fileResult.data) {
      return NextResponse.json(
        { error: fileResult.error || 'Arquivo não encontrado' },
        { status: fileResult.error?.includes('não encontrado') ? 404 : 500 }
      )
    }

    const { data, contentType, filename } = fileResult

    // Retornar o arquivo como stream
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename || 'anexo')}"`,
        'Cache-Control': 'private, max-age=3600', // Cache por 1 hora no cliente
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error: any) {
    console.error('Error serving attachment:', error)
    return NextResponse.json(
      { error: 'Erro ao servir anexo' },
      { status: 500 }
    )
  }
}
