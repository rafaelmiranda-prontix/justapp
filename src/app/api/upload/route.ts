import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadFile } from '@/lib/upload-service'
import { uploadChatAttachmentToSupabase } from '@/lib/supabase-storage'
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

// Tipos MIME permitidos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
]

// Extensões permitidas
const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
]

// Tamanho máximo: 20MB
const MAX_FILE_SIZE = 20 * 1024 * 1024

/**
 * Valida arquivo antes do upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Validar tamanho
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  if (file.size === 0) {
    return { valid: false, error: 'Arquivo vazio' }
  }

  // Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Tipos permitidos: ${ALLOWED_EXTENSIONS.join(', ')}`,
    }
  }

  // Validar extensão
  const fileName = file.name.toLowerCase()
  const extension = fileName.substring(fileName.lastIndexOf('.'))
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `Extensão não permitida. Extensões permitidas: ${ALLOWED_EXTENSIONS.join(', ')}`,
    }
  }

  // Sanitizar nome do arquivo (remover caracteres perigosos)
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  if (sanitizedName !== file.name) {
    // Nome foi sanitizado, mas permitimos o upload
    // O nome será sanitizado no servidor
  }

  return { valid: true }
}

/**
 * Sanitiza nome do arquivo removendo caracteres perigosos
 */
function sanitizeFileName(fileName: string): string {
  // Remover caracteres perigosos e manter apenas alfanuméricos, pontos, hífens e underscores
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 255) // Limitar tamanho
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Rate limiting por usuário
    const rateLimit = checkRateLimit(`upload:${session.user.id}`, RateLimitPresets.UPLOAD)

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Limite de uploads excedido. Aguarde antes de tentar novamente.' },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': RateLimitPresets.UPLOAD.maxRequests.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
          },
        }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const matchId = formData.get('matchId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Validar arquivo
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Sanitizar nome do arquivo
    const sanitizedName = sanitizeFileName(file.name)

    // Criar novo File com nome sanitizado
    const sanitizedFile = new File([file], sanitizedName, { type: file.type })

    // Se matchId estiver presente, usar Supabase (bucket privado para chat)
    if (matchId) {
      // Validar matchId (deve ser alfanumérico com hífens)
      if (!/^[a-zA-Z0-9_-]+$/.test(matchId)) {
        return NextResponse.json({ error: 'matchId inválido' }, { status: 400 })
      }

      const result = await uploadChatAttachmentToSupabase(
        sanitizedFile,
        matchId,
        session.user.id
      )

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      // Retornar URL do BFF autenticado ao invés de signed URL
      // O BFF sempre valida autenticação e permissões
      const bffUrl = `/api/chat/attachments/${result.path}`

      return NextResponse.json({
        success: true,
        data: {
          url: bffUrl, // URL do BFF autenticado
          path: result.path,
          filename: sanitizedName, // Usar nome sanitizado
        },
      })
    }

    // Caso contrário, usar upload local (para outros casos)
    const result = await uploadFile(sanitizedFile, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        filename: sanitizedName, // Usar nome sanitizado
      },
    })
  } catch (error) {
    logger.error('Error in upload API:', error)
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
  }
}

// Configuração do Next.js para aceitar arquivos grandes
export const config = {
  api: {
    bodyParser: false,
  },
}
