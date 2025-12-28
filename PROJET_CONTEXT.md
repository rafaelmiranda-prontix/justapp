# PROJECT_CONTEXT.md
# Nome do Projeto: LegalMatch (Uber Jurídico)
# Stack: Flutter + NestJS + Prisma + Supabase
# Versão: 1.1 (Definição Técnica)

---

## 1. Visão Geral do Projeto
Desenvolvimento de uma plataforma "mobile-first" que conecta pessoas com problemas jurídicos a advogados especialistas. O diferencial é o uso de **IA Generativa** para ouvir/ler o relato do usuário, estruturar o caso juridicamente e fazer o "match" com o advogado ideal.

---

## 2. Stack Tecnológica Definida

### Frontend (Mobile)
* **Framework:** **Flutter** (Dart)
* **Gerenciamento de Estado:** Bloc ou Riverpod (Sugestão: Riverpod pela simplicidade moderna).
* **Audio:** Pacote `flutter_sound` ou similar para gravação.

### Backend (API)
* **Runtime:** Node.js
* **Framework:** **NestJS** (TypeScript).
    * *Motivo:* Arquitetura robusta, injeção de dependência e fácil escalabilidade.
* **ORM:** **Prisma**.
    * *Motivo:* Type-safety, migrações fáceis e ótima DX (Developer Experience).

### Infraestrutura & Dados
* **Database:** **Supabase** (PostgreSQL).
* **Auth:** Supabase Auth (Gerencia JWT e Login Social).
* **Storage:** Supabase Storage (Para armazenar os áudios dos relatos).
* **IA:** OpenAI API (GPT-4o-mini + Whisper).
* **Monorepo Tool:** **Turborepo** (Orquestração de scripts e cache).

---

## 3. Regras de Negócio e Compliance (CRÍTICO)
1.  **Proibição de Split de Pagamento:** O cliente paga direto ao advogado. A plataforma monetiza via venda de "Lead/Contato" ou Assinatura do Advogado.
2.  **Anonimização:** Dados sensíveis são removidos pela IA antes do advogado aceitar o caso.
3.  **Sem Leilão:** Preços não são exibidos publicamente.

---

## 4. Modelagem de Dados (Prisma Schema)

Use este schema como base para o arquivo `schema.prisma`.

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Connection String do Supabase
}

// Enums
enum UserRole {
  CLIENT
  LAWYER
  ADMIN
}

enum UrgencyLevel {
  LOW
  MEDIUM
  HIGH
}

enum CaseStatus {
  PENDING_ANALYSIS // Aguardando IA
  OPEN             // Disponível para advogados
  MATCHED          // Advogado aceitou
  CLOSED           // Finalizado
  ARCHIVED
}

// Modelos

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  phone     String?
  avatarUrl String?
  role      UserRole @default(CLIENT)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  clientCases   Case[]   @relation("ClientCases")
  lawyerProfile Lawyer?  // Só existe se role == LAWYER
}

model Lawyer {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  
  oabNumber   String   @unique
  oabState    String   // Ex: SP, RJ
  bio         String?
  specialties String[] // Array de strings: ["Trabalhista", "Penal"]
  credits     Int      @default(0) // Sistema de monetização
  isVerified  Boolean  @default(false)

  // Relacionamentos
  matches     Match[]
}

model Case {
  id             String       @id @default(uuid())
  clientId       String
  client         User         @relation("ClientCases", fields: [clientId], references: [id])
  
  // Inputs do Usuário
  rawText        String?      @db.Text
  audioUrl       String?      // URL do Supabase Storage
  
  // Análise da IA (Campos estruturados)
  category       String?      // Ex: "Direito do Trabalho"
  subCategory    String?      // Ex: "Demissão"
  technicalSummary String?    @db.Text // Resumo anonimizado
  urgency        UrgencyLevel @default(MEDIUM)
  aiConfidence   Int?         // 0-100
  
  status         CaseStatus   @default(PENDING_ANALYSIS)
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  matches        Match[]
}

model Match {
  id        String   @id @default(uuid())
  caseId    String
  case      Case     @relation(fields: [caseId], references: [id])
  lawyerId  String
  lawyer    Lawyer   @relation(fields: [lawyerId], references: [id])
  
  acceptedAt DateTime @default(now())
  
  // Aqui poderia ter um chatLogId futuramente
}
```

## 5. Estrutura do Monorepo

O projeto segue uma estrutura de Monorepo para centralizar a gestão de dependências e scripts.

```text
/ (root)
├── apps/
│   ├── api/      # Backend NestJS (package.json)
│   └── mobile/   # App Flutter (pubspec.yaml + package.json proxy)
├── packages/     # Bibliotecas compartilhadas (ex: configs, types)
├── package.json  # Gerenciamento de workspaces (pnpm/yarn)
└── turbo.json    # Pipeline de build e tarefas
```