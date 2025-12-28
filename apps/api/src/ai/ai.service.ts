import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface CaseAnalysis {
  category: string;
  subCategory: string;
  technicalSummary: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
}

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async transcribeAudio(audioUrl: string): Promise<string> {
    try {
      // Download audio file
      const response = await fetch(audioUrl);
      const audioBlob = await response.blob();

      // Convert blob to file
      const audioFile = new File([audioBlob], 'audio.mp3', { type: 'audio/mpeg' });

      // Transcribe with Whisper
      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'pt',
      });

      return transcription.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  async analyzeCase(text: string): Promise<CaseAnalysis> {
    const systemPrompt = `Você é um assistente jurídico especializado em análise de casos.
Sua tarefa é analisar o relato de um problema jurídico e extrair:
1. Categoria principal (ex: Direito do Trabalho, Direito do Consumidor, Direito Civil, etc)
2. Subcategoria específica (ex: Demissão, Produto Defeituoso, Acidente de Trânsito, etc)
3. Resumo técnico ANONIMIZADO (remova nomes, CPF, endereços, números de documentos)
4. Nível de urgência (LOW, MEDIUM, HIGH)
5. Confiança na análise (0-100)

IMPORTANTE: No resumo técnico, substitua:
- Nomes de pessoas por "CLIENTE", "EMPREGADOR", "PARTE CONTRÁRIA", etc
- CPFs, RGs por "[DOCUMENTO REMOVIDO]"
- Endereços por "[ENDEREÇO REMOVIDO]"
- Telefones por "[TELEFONE REMOVIDO]"
- Valores específicos podem ser mantidos se relevantes

Responda APENAS em formato JSON válido.`;

    const userPrompt = `Analise o seguinte relato jurídico:

${text}

Retorne a análise em JSON com esta estrutura exata:
{
  "category": "categoria principal",
  "subCategory": "subcategoria",
  "technicalSummary": "resumo técnico anonimizado",
  "urgency": "LOW|MEDIUM|HIGH",
  "confidence": número entre 0 e 100
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(completion.choices[0].message.content);

      return {
        category: analysis.category,
        subCategory: analysis.subCategory,
        technicalSummary: analysis.technicalSummary,
        urgency: analysis.urgency,
        confidence: analysis.confidence,
      };
    } catch (error) {
      console.error('Error analyzing case:', error);
      throw error;
    }
  }
}
