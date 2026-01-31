'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Paperclip, X, Loader2, File, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  onFileSelect?: (file: File) => void
  onUploadError?: (error: string) => void
  maxSize?: number
  accept?: string
  disabled?: boolean
  className?: string
  matchId?: string // ID do match para upload em bucket privado
  selectedFile?: File | null // Arquivo selecionado (controlado pelo pai)
  onClear?: () => void // Callback para limpar arquivo
  // Flag explícita para indicar se o componente é controlado
  controlled?: boolean
}

export function FileUpload(props: FileUploadProps) {
  const {
    onFileSelect,
    onUploadError,
    maxSize = 20 * 1024 * 1024, // 20MB
    accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
    disabled = false,
    className,
    matchId,
    selectedFile: externalSelectedFile,
    onClear,
    controlled = false, // Por padrão, assume não controlado
  } = props

  const [internalSelectedFile, setInternalSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Determinar se é controlado: 
  // - Se controlled=true (explícito)
  // - OU se onFileSelect existe (indica que o pai quer controlar via callback)
  const isControlled = controlled || !!onFileSelect
  
  // Debug imediato das props recebidas - verificar diretamente do objeto props
  console.log('[FileUpload] Props object keys:', Object.keys(props))
  console.log('[FileUpload] Props received (from destructuring):', {
    controlled,
    hasOnFileSelect: !!onFileSelect,
    onFileSelectType: typeof onFileSelect,
    externalSelectedFile: externalSelectedFile?.name || 'null/undefined',
    externalSelectedFileType: typeof externalSelectedFile,
  })
  console.log('[FileUpload] Props received (from props object):', {
    controlled: props.controlled,
    hasOnFileSelect: !!props.onFileSelect,
    onFileSelectType: typeof props.onFileSelect,
    externalSelectedFile: props.selectedFile?.name || 'null/undefined',
    externalSelectedFileType: typeof props.selectedFile,
  })
  
  // Usar arquivo externo se controlado, senão usar interno
  const selectedFile = isControlled ? (externalSelectedFile ?? null) : internalSelectedFile
  
  // Debug: Log do estado no render
  useEffect(() => {
    console.log('[FileUpload] Render state:', {
      isControlled,
      controlled,
      hasOnFileSelect: !!onFileSelect,
      onFileSelectType: typeof onFileSelect,
      externalSelectedFile: externalSelectedFile?.name || 'null',
      internalSelectedFile: internalSelectedFile?.name || 'null',
      selectedFile: selectedFile?.name || 'null',
    })
  }, [isControlled, controlled, onFileSelect, externalSelectedFile, internalSelectedFile, selectedFile])

  // Limpar preview quando selectedFile mudar para null
  useEffect(() => {
    if (!selectedFile) {
      setPreview(null)
    }
  }, [selectedFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log('[FileUpload] No file selected')
      return
    }

    console.log('[FileUpload] File selected:', file.name, 'Size:', file.size, 'Type:', file.type)
    console.log('[FileUpload] Is controlled:', isControlled, 'externalSelectedFile:', externalSelectedFile)

    // Valida tamanho
    if (file.size > maxSize) {
      console.log('[FileUpload] File too large:', file.size, 'Max:', maxSize)
      onUploadError?.(`Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`)
      return
    }

    // SEMPRE notificar componente pai primeiro (se for controlado, o pai atualiza o estado)
    console.log('[FileUpload] Calling onFileSelect callback...')
    onFileSelect?.(file)
    console.log('[FileUpload] onFileSelect callback completed')

    // Se não for controlado, atualizar estado interno DEPOIS
    if (!isControlled) {
      console.log('[FileUpload] Updating internal state (uncontrolled)')
      setInternalSelectedFile(file)
    } else {
      console.log('[FileUpload] Component is controlled, waiting for parent to update state')
    }

    // Gera preview para imagens
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  const handleClear = () => {
    if (!isControlled) {
      setInternalSelectedFile(null)
    }
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClear?.()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept={accept}
        disabled={disabled}
        className="hidden"
      />

      {!selectedFile ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Anexar arquivo
        </Button>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <div className="flex-1 min-w-0">
            {preview ? (
              <div className="flex items-center gap-2">
                <div className="relative w-12 h-12 rounded overflow-hidden bg-background">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-12 h-12 rounded bg-background">
                  <File className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
