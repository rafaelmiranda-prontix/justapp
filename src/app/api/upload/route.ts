import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadFile } from '@/lib/upload-service'
import { uploadChatAttachmentToSupabase } from '@/lib/supabase-storage'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const matchId = formData.get('matchId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    // Se matchId estiver presente, usar Supabase (bucket privado para chat)
    if (matchId) {
      const result = await uploadChatAttachmentToSupabase(
        file,
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
          filename: file.name,
        },
      })
    }

    // Caso contrário, usar upload local (para outros casos)
    const result = await uploadFile(file, session.user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        filename: result.filename,
      },
    })
  } catch (error) {
    console.error('Error in upload API:', error)
    return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
  }
}

// Configuração do Next.js para aceitar arquivos grandes
export const config = {
  api: {
    bodyParser: false,
  },
}
