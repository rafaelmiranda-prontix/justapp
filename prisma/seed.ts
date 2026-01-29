import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Criar especialidades iniciais
  const especialidades = [
    {
      nome: 'Direito do Consumidor',
      slug: 'consumidor',
      descricao:
        'Casos relacionados a produtos defeituosos, serviços mal prestados, cobranças indevidas, entre outros.',
      palavrasChave: [
        'consumidor',
        'produto',
        'defeito',
        'serviço',
        'cobrança',
        'indevida',
        'compra',
        'venda',
        'garantia',
        'troca',
        'devolução',
        'loja',
        'empresa',
        'atendimento',
        'sac',
      ],
    },
    {
      nome: 'Direito Trabalhista',
      slug: 'trabalhista',
      descricao:
        'Questões relacionadas a contratos de trabalho, demissões, verbas rescisórias, horas extras, etc.',
      palavrasChave: [
        'trabalho',
        'emprego',
        'demissão',
        'rescisão',
        'salário',
        'horas extras',
        'férias',
        'justa causa',
        'clt',
        'carteira',
        'empresa',
        'patrão',
      ],
    },
    {
      nome: 'Direito de Família',
      slug: 'familia',
      descricao: 'Divórcio, pensão alimentícia, guarda de filhos, partilha de bens, etc.',
      palavrasChave: [
        'divórcio',
        'separação',
        'pensão',
        'alimentos',
        'guarda',
        'filho',
        'partilha',
        'bens',
        'casamento',
        'união estável',
      ],
    },
    {
      nome: 'Direito Imobiliário',
      slug: 'imobiliario',
      descricao: 'Compra e venda de imóveis, locações, financiamentos, usucapião, etc.',
      palavrasChave: [
        'imóvel',
        'casa',
        'apartamento',
        'aluguel',
        'locação',
        'compra',
        'venda',
        'financiamento',
        'despejo',
        'proprietário',
        'inquilino',
      ],
    },
  ]

  for (const esp of especialidades) {
    await prisma.especialidade.upsert({
      where: { slug: esp.slug },
      update: esp,
      create: esp,
    })
    console.log(`✅ Especialidade criada: ${esp.nome}`)
  }

  console.log('✨ Seed completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
