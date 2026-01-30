import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

// Tipos permitidos para upload
const ALLOWED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
}

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

interface UploadResult {
  success: boolean
  url?: string
  filename?: string
  error?: string
}

/**
 * Valida o arquivo antes do upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Verifica tamanho
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    }
  }

  // Verifica tipo
  const allowedTypes = Object.keys(ALLOWED_FILE_TYPES)
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não permitido',
    }
  }

  return { valid: true }
}

/**
 * Faz upload do arquivo para o sistema local
 * Em produção, trocar por S3/Cloudflare R2
 */
export async function uploadFile(file: File, userId: string): Promise<UploadResult> {
  try {
    // Valida arquivo
    const validation = validateFile(file)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    // Gera nome único
    const fileExtension = path.extname(file.name)
    const randomName = crypto.randomBytes(16).toString('hex')
    const filename = `${userId}-${randomName}${fileExtension}`

    // Diretório de upload
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'attachments')

    // Cria diretório se não existir
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Converte File para Buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Salva arquivo
    const filePath = path.join(uploadDir, filename)
    await writeFile(filePath, buffer)

    // URL pública
    const publicUrl = `/uploads/attachments/${filename}`

    return {
      success: true,
      url: publicUrl,
      filename,
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    return {
      success: false,
      error: 'Erro ao fazer upload do arquivo',
    }
  }
}

/**
 * Upload para Cloudflare R2 (para produção)
 * Requer configuração das variáveis de ambiente:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 */
export async function uploadToR2(file: File, userId: string): Promise<UploadResult> {
  // TODO: Implementar quando configurar R2
  // Para agora, usa upload local
  return uploadFile(file, userId)
}

/**
 * Deleta arquivo (local ou R2)
 */
export async function deleteFile(fileUrl: string): Promise<boolean> {
  try {
    // Se for local
    if (fileUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', fileUrl)
      const { unlink } = await import('fs/promises')
      await unlink(filePath)
      return true
    }

    // Se for R2, implementar delete no R2
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}
