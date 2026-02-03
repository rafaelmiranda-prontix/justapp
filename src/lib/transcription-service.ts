import { logger } from './logger'

/**
 * Transcreve áudio de uma URL para texto
 * Usa a API de transcrição existente
 */
export async function transcribeAudio(audioUrl: string): Promise<string | null> {
  try {
    // Baixar o áudio da URL
    const response = await fetch(audioUrl)
    if (!response.ok) {
      logger.error(`[Transcription] Failed to fetch audio from ${audioUrl}`)
      return null
    }

    const audioBlob = await response.blob()
    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' })

    // Fazer upload para a API de transcrição
    const formData = new FormData()
    formData.append('audio', audioFile)

    const transcribeResponse = await fetch('/api/transcribe-audio', {
      method: 'POST',
      body: formData,
    })

    if (!transcribeResponse.ok) {
      logger.error(`[Transcription] Failed to transcribe audio: ${transcribeResponse.statusText}`)
      return null
    }

    const result = await transcribeResponse.json()
    if (result.success && result.text) {
      return result.text
    }

    return null
  } catch (error) {
    logger.error('[Transcription] Error transcribing audio:', error)
    return null
  }
}
