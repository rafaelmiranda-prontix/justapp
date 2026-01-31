import { prisma } from '../src/lib/prisma'
import { nanoid } from 'nanoid'

async function seedEspecialidades() {
  console.log('⚖️  Criando especialidades jurídicas...\n')

  const especialidades = [
    // Direito Civil
    {
      nome: 'Direito Civil',
      slug: 'direito-civil',
      descricao: 'Contratos, responsabilidade civil, direitos reais, família e sucessões',
      palavrasChave: [
        'civil',
        'contrato',
        'família',
        'divórcio',
        'inventário',
        'herança',
        'sucessão',
        'casamento',
        'união estável',
        'partilha',
        'responsabilidade civil',
        'danos morais',
        'indenização',
      ],
    },

    // Direito Trabalhista
    {
      nome: 'Direito Trabalhista',
      slug: 'direito-trabalhista',
      descricao: 'Relações de trabalho, rescisões, direitos trabalhistas e sindicais',
      palavrasChave: [
        'trabalho',
        'trabalhista',
        'emprego',
        'demissão',
        'rescisão',
        'justa causa',
        'fgts',
        'hora extra',
        'férias',
        'salário',
        'clt',
        'vínculo empregatício',
        'pejotização',
        'acidente de trabalho',
      ],
    },

    // Direito Penal
    {
      nome: 'Direito Penal',
      slug: 'direito-penal',
      descricao: 'Crimes, defesa criminal, processos penais e medidas cautelares',
      palavrasChave: [
        'penal',
        'criminal',
        'crime',
        'furto',
        'roubo',
        'estelionato',
        'lesão corporal',
        'homicídio',
        'defesa',
        'habeas corpus',
        'prisão',
        'delegacia',
        'boletim de ocorrência',
        'processo criminal',
      ],
    },

    // Direito do Consumidor
    {
      nome: 'Direito do Consumidor',
      slug: 'direito-consumidor',
      descricao: 'Defesa do consumidor, produtos e serviços defeituosos, CDC',
      palavrasChave: [
        'consumidor',
        'cdc',
        'compra',
        'venda',
        'serviço',
        'produto defeituoso',
        'garantia',
        'troca',
        'devolução',
        'cobrança indevida',
        'serasa',
        'spc',
        'negativação',
        'protesto',
      ],
    },

    // Direito Imobiliário
    {
      nome: 'Direito Imobiliário',
      slug: 'direito-imobiliario',
      descricao: 'Compra e venda de imóveis, locação, usucapião, regularização',
      palavrasChave: [
        'imóvel',
        'imobiliário',
        'casa',
        'apartamento',
        'terreno',
        'aluguel',
        'locação',
        'despejo',
        'inquilino',
        'proprietário',
        'compra e venda',
        'escritura',
        'usucapião',
        'posse',
      ],
    },

    // Direito Previdenciário
    {
      nome: 'Direito Previdenciário',
      slug: 'direito-previdenciario',
      descricao: 'Aposentadorias, benefícios do INSS, pensões e auxílios',
      palavrasChave: [
        'previdenciário',
        'inss',
        'aposentadoria',
        'benefício',
        'pensão',
        'auxílio doença',
        'auxílio acidente',
        'bpc',
        'loas',
        'revisão',
        'perícia',
        'tempo de contribuição',
      ],
    },

    // Direito de Família
    {
      nome: 'Direito de Família',
      slug: 'direito-familia',
      descricao: 'Divórcio, guarda, pensão alimentícia, adoção e união estável',
      palavrasChave: [
        'família',
        'divórcio',
        'separação',
        'guarda',
        'pensão alimentícia',
        'alimentos',
        'união estável',
        'casamento',
        'adoção',
        'guarda compartilhada',
        'visitação',
        'reconhecimento de paternidade',
      ],
    },

    // Direito Tributário
    {
      nome: 'Direito Tributário',
      slug: 'direito-tributario',
      descricao: 'Impostos, tributos, questões fiscais e planejamento tributário',
      palavrasChave: [
        'tributário',
        'imposto',
        'tributo',
        'fiscal',
        'receita federal',
        'icms',
        'issqn',
        'iptu',
        'ipva',
        'ir',
        'pis',
        'cofins',
        'sonegação',
        'parcelamento',
      ],
    },

    // Direito Empresarial
    {
      nome: 'Direito Empresarial',
      slug: 'direito-empresarial',
      descricao: 'Contratos empresariais, sociedades, recuperação judicial e falência',
      palavrasChave: [
        'empresarial',
        'empresa',
        'societário',
        'contrato empresarial',
        'sociedade',
        'cnpj',
        'mei',
        'microempresa',
        'recuperação judicial',
        'falência',
        'sócio',
        'dissolução',
      ],
    },

    // Direito Digital
    {
      nome: 'Direito Digital',
      slug: 'direito-digital',
      descricao: 'Crimes digitais, LGPD, proteção de dados, propriedade intelectual',
      palavrasChave: [
        'digital',
        'internet',
        'lgpd',
        'dados pessoais',
        'privacidade',
        'crime digital',
        'cyber',
        'hacker',
        'vazamento',
        'difamação online',
        'fake news',
        'propriedade intelectual',
      ],
    },

    // Direito Médico e da Saúde
    {
      nome: 'Direito Médico e da Saúde',
      slug: 'direito-medico-saude',
      descricao: 'Erro médico, planos de saúde, negativas de cobertura',
      palavrasChave: [
        'médico',
        'saúde',
        'plano de saúde',
        'convênio',
        'erro médico',
        'negligência médica',
        'hospital',
        'cirurgia',
        'tratamento',
        'cobertura',
        'negativa',
        'ans',
      ],
    },

    // Direito Administrativo
    {
      nome: 'Direito Administrativo',
      slug: 'direito-administrativo',
      descricao: 'Concursos, servidores públicos, licitações e contratos administrativos',
      palavrasChave: [
        'administrativo',
        'servidor público',
        'concurso',
        'estatutário',
        'licitação',
        'contrato administrativo',
        'desapropriação',
        'multa administrativa',
        'processo administrativo',
      ],
    },

    // Direito Ambiental
    {
      nome: 'Direito Ambiental',
      slug: 'direito-ambiental',
      descricao: 'Licenciamento ambiental, crimes ambientais, regularização',
      palavrasChave: [
        'ambiental',
        'meio ambiente',
        'licença ambiental',
        'desmatamento',
        'poluição',
        'ibama',
        'crime ambiental',
        'reserva legal',
        'app',
        'car',
      ],
    },

    // Direito Bancário
    {
      nome: 'Direito Bancário',
      slug: 'direito-bancario',
      descricao: 'Contratos bancários, empréstimos, financiamentos, cartões de crédito',
      palavrasChave: [
        'bancário',
        'banco',
        'empréstimo',
        'financiamento',
        'cartão de crédito',
        'cheque especial',
        'juros abusivos',
        'tarifas',
        'consignado',
        'cdc',
      ],
    },

    // Direito de Trânsito
    {
      nome: 'Direito de Trânsito',
      slug: 'direito-transito',
      descricao: 'Multas de trânsito, suspensão de CNH, recursos administrativos',
      palavrasChave: [
        'trânsito',
        'multa',
        'cnh',
        'habilitação',
        'suspensão',
        'detran',
        'infração',
        'pontos',
        'recurso',
        'defesa prévia',
        'acidente de trânsito',
      ],
    },
  ]

  let created = 0
  let updated = 0
  let skipped = 0

  for (const esp of especialidades) {
    try {
      // Verificar se já existe
      const existing = await prisma.especialidades.findUnique({
        where: { slug: esp.slug },
      })

      if (existing) {
        // Atualizar dados (exceto id)
        await prisma.especialidades.update({
          where: { slug: esp.slug },
          data: {
            nome: esp.nome,
            descricao: esp.descricao,
            palavrasChave: esp.palavrasChave,
            updatedAt: new Date(),
          },
        })
        console.log(`✏️  Atualizada: ${esp.nome}`)
        updated++
      } else {
        // Criar nova
        await prisma.especialidades.create({
          data: {
            id: nanoid(),
            nome: esp.nome,
            slug: esp.slug,
            descricao: esp.descricao,
            palavrasChave: esp.palavrasChave,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        })
        console.log(`✅ Criada: ${esp.nome}`)
        created++
      }
    } catch (error: any) {
      console.error(`❌ Erro ao processar ${esp.nome}:`, error.message)
      skipped++
    }
  }

  console.log('\n📊 Resumo:')
  console.log(`   ✅ Criadas: ${created}`)
  console.log(`   ✏️  Atualizadas: ${updated}`)
  console.log(`   ❌ Erros: ${skipped}`)
  console.log(`   📝 Total processadas: ${especialidades.length}`)

  // Estatísticas
  const total = await prisma.especialidades.count()
  console.log(`\n📚 Total de especialidades no banco: ${total}`)

  // Listar todas
  if (total <= 20) {
    console.log('\n📋 Especialidades cadastradas:')
    const todas = await prisma.especialidades.findMany({
      orderBy: { nome: 'asc' },
    })
    todas.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.nome} (${e.palavrasChave.length} palavras-chave)`)
    })
  }

  console.log('\n✅ Especialidades criadas/atualizadas com sucesso!')
}

seedEspecialidades()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
