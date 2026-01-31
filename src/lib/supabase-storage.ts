import { createClient } from '@supabase/supabase-js'

// Inicializar cliente Supabase com service role key (bypassa RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[Supabase Storage] Variáveis de ambiente não configuradas. Upload de áudio não funcionará.'
  )
}

// Verificar se a service role key está correta
if (supabaseServiceKey && !supabaseServiceKey.startsWith('eyJ')) {
  console.error(
    '[Supabase Storage] ⚠️ ERRO: A service role key deve ser um JWT token que começa com "eyJ". ' +
    'Verifique se está usando a service_role key (não a anon key) em SUPABASE_SERVICE_ROLE_KEY. ' +
    'Encontre em: Settings → API → service_role'
  )
}

// Criar cliente com service role key que bypassa RLS
// IMPORTANTE: A service role key deve bypassar RLS automaticamente
// Se ainda houver erro, pode ser necessário desabilitar RLS no bucket ou ajustar as políticas
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null

// Nome dos buckets - Supabase Storage é case-sensitive
// IMPORTANTE: Use o nome exato do bucket criado no Supabase
const AUDIO_BUCKET = 'audio-messages'
const CHAT_ATTACHMENTS_BUCKET = 'chat-attachments' // Bucket privado para anexos de chat

interface UploadAudioResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

/**
 * Verifica se o bucket existe
 */
async function ensureBucketExists(): Promise<{ exists: boolean; buckets?: string[] }> {
  if (!supabase) {
    return { exists: false }
  }

  try {
    const { data, error } = await supabase.storage.listBuckets()
    
    if (error) {
      console.error('[Supabase Storage] Error listing buckets:', error)
      // Se der erro ao listar, assumir que o bucket existe e tentar fazer upload
      // (pode ser problema de permissão na listagem, mas upload pode funcionar)
      return { exists: true }
    }

    const bucketNames = data?.map(bucket => bucket.name) || []
    const bucketExists = bucketNames.includes(AUDIO_BUCKET)
    
    if (!bucketExists) {
      console.warn(`[Supabase Storage] Bucket "${AUDIO_BUCKET}" não encontrado na lista.`)
      console.log('[Supabase Storage] Buckets disponíveis:', bucketNames)
      console.log('[Supabase Storage] Tentando fazer upload mesmo assim...')
    }

    return { exists: bucketExists, buckets: bucketNames }
  } catch (error) {
    console.error('[Supabase Storage] Error checking bucket:', error)
    // Em caso de erro, assumir que existe e tentar fazer upload
    return { exists: true }
  }
}

/**
 * Faz upload de áudio para o Supabase Storage
 */
export async function uploadAudioToSupabase(
  audioBlob: Blob,
  sessionId: string
): Promise<UploadAudioResult> {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY',
    }
  }

  // Debug: Verificar configuração
  const serviceKeyPrefix = supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'Não configurado'
  const isServiceKeyValid = supabaseServiceKey?.startsWith('eyJ') || false
  
  console.log('[Supabase Storage] Config:', {
    url: supabaseUrl ? '✅ Configurado' : '❌ Não configurado',
    serviceKey: supabaseServiceKey ? `✅ ${serviceKeyPrefix}` : '❌ Não configurado',
    serviceKeyValid: isServiceKeyValid ? '✅ JWT válido' : '❌ NÃO É JWT (deve começar com "eyJ")',
    bucket: AUDIO_BUCKET,
  })
  
  if (!isServiceKeyValid && supabaseServiceKey) {
    return {
      success: false,
      error: 'A service role key está incorreta. Ela deve ser um JWT token que começa com "eyJ". Verifique se está usando a service_role key (não a anon key) em SUPABASE_SERVICE_ROLE_KEY. Encontre em: Settings → API → service_role',
    }
  }

  // Verificar se o bucket existe (mas não bloquear se a verificação falhar)
  const bucketCheck = await ensureBucketExists()
  if (!bucketCheck.exists && bucketCheck.buckets) {
    console.warn(`[Supabase Storage] Bucket "${AUDIO_BUCKET}" não encontrado. Buckets disponíveis: ${bucketCheck.buckets.join(', ')}`)
    // Não bloquear, apenas avisar - pode ser problema na listagem mas o upload pode funcionar
  }

  try {
    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const filename = `${sessionId}/${timestamp}-${randomId}.webm`

    // Converter Blob para ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer()
    const file = new File([arrayBuffer], filename, { type: 'audio/webm;codecs=opus' })

    // Fazer upload
    console.log('[Supabase Storage] Uploading audio:', {
      bucket: AUDIO_BUCKET,
      filename,
      size: file.size,
      type: file.type,
    })

    // Tentar fazer upload
    const { data, error } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(filename, file, {
        contentType: 'audio/webm;codecs=opus',
        upsert: false,
        cacheControl: '3600',
      })

    if (error) {
      console.error('[Supabase Storage] Upload error:', {
        message: error.message,
        statusCode: error.statusCode,
        name: error.name,
        error: JSON.stringify(error, null, 2),
      })
      
      // Mensagens de erro mais específicas
      if (error.message?.includes('row-level security') || 
          error.message?.includes('RLS') || 
          error.message?.includes('policy') ||
          error.statusCode === 403) {
        return {
          success: false,
          error: `Erro de permissão (RLS). Verifique:
1. O bucket "${AUDIO_BUCKET}" existe
2. As políticas RLS estão configuradas corretamente para o bucket "${AUDIO_BUCKET}"
3. A service role key está sendo usada (não a anon key)
4. A política de INSERT para service_role está ativa

Erro detalhado: ${error.message}`,
        }
      }
      
      if (error.message?.includes('Bucket not found') || error.statusCode === 404) {
        return {
          success: false,
          error: `Bucket "${AUDIO_BUCKET}" não encontrado. Verifique se o nome do bucket está correto no Supabase Dashboard.`,
        }
      }
      
      return {
        success: false,
        error: `Erro ao fazer upload: ${error.message || 'Erro desconhecido'}`,
      }
    }

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(data.path)

    return {
      success: true,
      url: publicUrl,
      path: data.path,
    }
  } catch (error: any) {
    console.error('[Supabase Storage] Error:', error)
    return {
      success: false,
      error: error.message || 'Erro ao fazer upload do áudio',
    }
  }
}

/**
 * Deleta áudio do Supabase Storage
 */
export async function deleteAudioFromSupabase(path: string): Promise<boolean> {
  if (!supabase) {
    return false
  }

  try {
    const { error } = await supabase.storage.from(AUDIO_BUCKET).remove([path])

    if (error) {
      console.error('[Supabase Storage] Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[Supabase Storage] Error deleting:', error)
    return false
  }
}

/**
 * Interface para resultado de upload de anexo de chat
 */
interface UploadChatAttachmentResult {
  success: boolean
  url?: string
  path?: string
  signedUrl?: string // URL assinada para acesso privado
  error?: string
}

/**
 * Faz upload de anexo de chat para bucket privado do Supabase
 * Retorna uma signed URL que expira após 1 hora
 */
export async function uploadChatAttachmentToSupabase(
  file: File,
  matchId: string,
  userId: string
): Promise<UploadChatAttachmentResult> {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY',
    }
  }

  // Validar service role key
  if (supabaseServiceKey && !supabaseServiceKey.startsWith('eyJ')) {
    return {
      success: false,
      error: 'A service role key está incorreta. Ela deve ser um JWT token que começa com "eyJ".',
    }
  }

  try {
    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop() || 'bin'
    const filename = `${matchId}/${userId}/${timestamp}-${randomId}.${fileExtension}`

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBlob = new File([arrayBuffer], filename, { type: file.type })

    console.log('[Supabase Storage] Uploading chat attachment:', {
      bucket: CHAT_ATTACHMENTS_BUCKET,
      filename,
      size: file.size,
      type: file.type,
      matchId,
      userId,
    })

    // Fazer upload para bucket privado
    const { data, error } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .upload(filename, fileBlob, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600',
      })

    if (error) {
      console.error('[Supabase Storage] Upload error:', {
        message: error.message,
        statusCode: error.statusCode,
        name: error.name,
      })

      if (error.message?.includes('row-level security') || 
          error.message?.includes('RLS') || 
          error.message?.includes('policy') ||
          error.statusCode === 403) {
        return {
          success: false,
          error: `Erro de permissão (RLS). Verifique:
1. O bucket "${CHAT_ATTACHMENTS_BUCKET}" existe
2. As políticas RLS estão configuradas corretamente
3. A service role key está sendo usada

Erro detalhado: ${error.message}`,
        }
      }

      if (error.message?.includes('Bucket not found') || error.statusCode === 404) {
        return {
          success: false,
          error: `Bucket "${CHAT_ATTACHMENTS_BUCKET}" não encontrado. Verifique se o bucket foi criado no Supabase Dashboard.`,
        }
      }

      return {
        success: false,
        error: `Erro ao fazer upload: ${error.message || 'Erro desconhecido'}`,
      }
    }

    // Gerar signed URL que expira em 1 hora (3600 segundos)
    // Esta URL permite acesso privado ao arquivo
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .createSignedUrl(data.path, 3600) // Expira em 1 hora

    if (signedUrlError) {
      console.error('[Supabase Storage] Error creating signed URL:', signedUrlError)
      // Mesmo sem signed URL, retornar sucesso com o path
      // A signed URL pode ser gerada depois quando necessário
      return {
        success: true,
        path: data.path,
        url: data.path, // Fallback: usar path como URL
      }
    }

    return {
      success: true,
      path: data.path,
      signedUrl: signedUrlData.signedUrl,
      url: signedUrlData.signedUrl, // URL assinada para acesso privado
    }
  } catch (error: any) {
    console.error('[Supabase Storage] Error:', error)
    return {
      success: false,
      error: error.message || 'Erro ao fazer upload do anexo',
    }
  }
}

/**
 * Gera uma signed URL para um anexo de chat existente
 * Útil para regenerar URLs que expiraram
 */
export async function getChatAttachmentSignedUrl(
  path: string,
  expiresIn: number = 3600 // 1 hora por padrão
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase não configurado',
    }
  }

  try {
    const { data, error } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .createSignedUrl(path, expiresIn)

    if (error) {
      console.error('[Supabase Storage] Error creating signed URL:', error)
      return {
        success: false,
        error: error.message || 'Erro ao gerar URL assinada',
      }
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
    }
  } catch (error: any) {
    console.error('[Supabase Storage] Error:', error)
    return {
      success: false,
      error: error.message || 'Erro ao gerar URL assinada',
    }
  }
}

/**
 * Interface para resultado de download de arquivo
 */
interface GetChatAttachmentFileResult {
  success: boolean
  data?: ArrayBuffer
  contentType?: string
  filename?: string
  error?: string
}

/**
 * Baixa um arquivo de anexo de chat do Supabase Storage
 * Usado pelo BFF autenticado para servir arquivos
 */
export async function getChatAttachmentFile(
  path: string
): Promise<GetChatAttachmentFileResult> {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase não configurado',
    }
  }

  try {
    // Baixar o arquivo do bucket privado
    const { data, error } = await supabase.storage
      .from(CHAT_ATTACHMENTS_BUCKET)
      .download(path)

    if (error) {
      console.error('[Supabase Storage] Download error:', {
        message: error.message,
        statusCode: error.statusCode,
        name: error.name,
      })

      if (error.message?.includes('not found') || error.statusCode === 404) {
        return {
          success: false,
          error: 'Arquivo não encontrado',
        }
      }

      return {
        success: false,
        error: `Erro ao baixar arquivo: ${error.message || 'Erro desconhecido'}`,
      }
    }

    if (!data) {
      return {
        success: false,
        error: 'Arquivo vazio ou não encontrado',
      }
    }

    // Converter Blob para ArrayBuffer
    const arrayBuffer = await data.arrayBuffer()

    // Extrair nome do arquivo do path
    const pathParts = path.split('/')
    const filename = pathParts[pathParts.length - 1] || 'anexo'

    // Tentar detectar content type do arquivo
    let contentType = 'application/octet-stream'
    const extension = filename.split('.').pop()?.toLowerCase()
    
    const mimeTypes: Record<string, string> = {
      // Imagens
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      // Documentos
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // Texto
      txt: 'text/plain',
      // Áudio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      webm: 'audio/webm',
    }

    if (extension && mimeTypes[extension]) {
      contentType = mimeTypes[extension]
    }

    return {
      success: true,
      data: arrayBuffer,
      contentType,
      filename,
    }
  } catch (error: any) {
    console.error('[Supabase Storage] Error downloading file:', error)
    return {
      success: false,
      error: error.message || 'Erro ao baixar arquivo',
    }
  }
}

/**
 * Deleta anexo de chat do Supabase Storage
 */
export async function deleteChatAttachmentFromSupabase(path: string): Promise<boolean> {
  if (!supabase) {
    return false
  }

  try {
    const { error } = await supabase.storage.from(CHAT_ATTACHMENTS_BUCKET).remove([path])

    if (error) {
      console.error('[Supabase Storage] Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[Supabase Storage] Error deleting:', error)
    return false
  }
}
