import { prisma } from '../src/lib/prisma'
import { hash } from 'bcryptjs'
import { nanoid } from 'nanoid'

async function seedLawyers() {
  console.log('🌱 Criando advogados de teste...\n')

  // Buscar especialidades existentes
  const especialidades = await prisma.especialidades.findMany()

  if (especialidades.length === 0) {
    console.log('❌ Nenhuma especialidade encontrada. Criando especialidades básicas...')

    const especialidadesBasicas = [
      { id: nanoid(), nome: 'Direito Civil', slug: 'direito-civil', palavrasChave: ['civil', 'contrato', 'família'] },
      { id: nanoid(), nome: 'Direito Trabalhista', slug: 'direito-trabalhista', palavrasChave: ['trabalho', 'emprego', 'trabalhista'] },
      { id: nanoid(), nome: 'Direito Penal', slug: 'direito-penal', palavrasChave: ['penal', 'criminal', 'crime'] },
      { id: nanoid(), nome: 'Direito do Consumidor', slug: 'direito-consumidor', palavrasChave: ['consumidor', 'compra', 'serviço'] },
      { id: nanoid(), nome: 'Direito Imobiliário', slug: 'direito-imobiliario', palavrasChave: ['imóvel', 'aluguel', 'propriedade'] },
    ]

    for (const esp of especialidadesBasicas) {
      await prisma.especialidades.create({
        data: {
          ...esp,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })
    }

    console.log(`✅ ${especialidadesBasicas.length} especialidades criadas\n`)
  }

  // Recarregar especialidades
  const todasEspecialidades = await prisma.especialidades.findMany()

  // Advogados de teste
  const lawyers = [
    {
      name: 'Dr. João Silva',
      email: 'joao.silva@advogado.com',
      oab: 'SP123456',
      cidade: 'São Paulo',
      estado: 'SP',
      plano: 'PREMIUM' as const,
      especialidades: ['Direito Civil', 'Direito Imobiliário'],
    },
    {
      name: 'Dra. Maria Santos',
      email: 'maria.santos@advogado.com',
      oab: 'RJ789012',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      plano: 'BASIC' as const,
      especialidades: ['Direito Trabalhista', 'Direito do Consumidor'],
    },
    {
      name: 'Dr. Carlos Oliveira',
      email: 'carlos.oliveira@advogado.com',
      oab: 'SP345678',
      cidade: 'Campinas',
      estado: 'SP',
      plano: 'BASIC' as const,
      especialidades: ['Direito Penal'],
    },
    {
      name: 'Dra. Ana Costa',
      email: 'ana.costa@advogado.com',
      oab: 'MG901234',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      plano: 'FREE' as const,
      especialidades: ['Direito Civil'],
    },
  ]

  // Senha padrão: "senha123"
  const defaultPassword = await hash('senha123', 10)

  for (const lawyer of lawyers) {
    // Verificar se já existe
    const existing = await prisma.users.findUnique({
      where: { email: lawyer.email },
    })

    if (existing) {
      console.log(`⏭️  Advogado já existe: ${lawyer.email}`)
      continue
    }

    // Criar usuário
    const userId = nanoid()
    const user = await prisma.users.create({
      data: {
        id: userId,
        email: lawyer.email,
        name: lawyer.name,
        password: defaultPassword,
        role: 'ADVOGADO',
        status: 'ACTIVE',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Definir limite de leads baseado no plano
    let leadsLimite = 3 // FREE
    if (lawyer.plano === 'BASIC') leadsLimite = 10
    if (lawyer.plano === 'PREMIUM') leadsLimite = 50

    // Criar perfil de advogado
    const advogadoId = nanoid()
    const advogado = await prisma.advogados.create({
      data: {
        id: advogadoId,
        userId: user.id,
        oab: lawyer.oab,
        oabVerificado: true,
        cidade: lawyer.cidade,
        estado: lawyer.estado,
        plano: lawyer.plano,
        leadsRecebidosMes: 0,
        leadsLimiteMes: leadsLimite,
        ultimoResetLeads: new Date(),
        onboardingCompleted: true, // IMPORTANTE: Marcar como completo
        raioAtuacao: 50, // 50km
        aceitaOnline: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    // Associar especialidades
    for (const espNome of lawyer.especialidades) {
      const especialidade = todasEspecialidades.find((e) => e.nome === espNome)
      if (especialidade) {
        await prisma.advogado_especialidades.create({
          data: {
            advogadoId: advogado.id,
            especialidadeId: especialidade.id,
          },
        })
      }
    }

    console.log(`✅ Advogado criado: ${lawyer.name} (${lawyer.email})`)
    console.log(`   OAB: ${lawyer.oab}`)
    console.log(`   Plano: ${lawyer.plano} (${leadsLimite} leads/mês)`)
    console.log(`   Especialidades: ${lawyer.especialidades.join(', ')}`)
    console.log(`   Login: ${lawyer.email} / senha123\n`)
  }

  console.log('\n✅ Seed de advogados concluído!')
  console.log('\n📋 Informações de Login:')
  console.log('Email: [qualquer email acima]')
  console.log('Senha: senha123')
}

seedLawyers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
