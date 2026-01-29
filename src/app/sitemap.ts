import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    // Busca advogados públicos para incluir no sitemap
    const advogados = await prisma.advogado.findMany({
      where: {
        oabVerificado: true,
      },
      select: {
        id: true,
        updatedAt: true,
      },
      take: 1000, // Limite para não sobrecarregar
    })

    const advogadoUrls = advogados.map((advogado) => ({
      url: `${baseUrl}/advogados/${advogado.id}`,
      lastModified: advogado.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/signup/cidadao`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: `${baseUrl}/signup/advogado`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      ...advogadoUrls,
    ]
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Retorna sitemap básico em caso de erro
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ]
  }
} catch (error) {
    console.error('Error generating sitemap:', error)
    // Retorna sitemap básico em caso de erro
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ]
  }
}
