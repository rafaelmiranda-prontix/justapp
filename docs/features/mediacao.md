## Feature: Intermediação do Caso pelo Painel Administrativo

### Objetivo

Permitir que um **admin**:

1. **Assuma a mediação** de um caso (com lock/ownership)
2. **Se comunique com o cidadão** que abriu o caso (chat)
3. **Solicite informações/anexos** e registre observações internas
4. **Encaminhe** (opcional) para advogado específico ou ajuste status/alocação
5. **Feche** o caso com motivo e trilha de auditoria

---

## Fluxo principal (Admin)

### 1) “Assumir mediação”

* Botão no detalhe do caso: **“Assumir”**
* Ao assumir:

  * salva `mediatedByAdminId`
  * salva `mediatedAt`
  * status do caso pode ir para **EM_MEDIAÇÃO** (novo status)
  * cria log de auditoria (ação crítica)

**Regra**: só 1 admin por vez (evita dois mexendo ao mesmo tempo).

* Se outro admin tentar: mensagem “Caso já está em mediação por Fulano”.

### 2) Comunicação com o cliente (cidadão)

No detalhe do caso, criar aba **“Conversas”** com:

* Chat “Admin ↔ Cidadão”
* Suporte a anexos (você já tem upload)
* Template rápido de mensagens (atalhos):

  * “Pode detalhar melhor o ocorrido?”
  * “Envie prints/contrato/comprovantes”
  * “Qual data e local do fato?”
  * “Podemos encerrar como resolvido?”

**Importante**: esse chat é “canal oficial do caso”, separado do chat cidadão-advogado (pra não misturar).

### 3) Checklist de pendências (para fechar o caso)

Aba **“Checklist”** (simples):

* [ ] Documentos recebidos
* [ ] Informações mínimas (cidade/estado, datas, valor, etc.)
* [ ] Orientação enviada
* [ ] Encaminhado para advogado (se aplicável)

### 4) Encaminhamento / ações administrativas (opcional)

Ainda dentro do caso, ações rápidas:

* **Alocar** para advogado X (se você quiser bypass do matching)
* **Dealocar**
* **Alterar status**
* **Adicionar nota interna** (não visível ao cidadão)

### 5) Fechamento do caso

Botão **“Fechar Caso”** abre modal com:

* **Motivo do fechamento** (enum):

  * RESOLVIDO
  * SEM_RETORNO_DO_CLIENTE
  * INCOMPLETO/SEM_DOCUMENTOS
  * DUPLICADO
  * FORA_DO_ESCOPO
  * ENCERRADO_COM_ENCAMINHAMENTO
* Campo texto: **Resumo do fechamento**
* Checkbox: “Notificar cidadão por e-mail” (default: sim)

Ao fechar:

* status -> **FECHADO**
* salva `closedAt`, `closedByAdminId`, `closeReason`, `closeSummary`
* gera auditoria
* dispara notificação

---

## Permissões e segurança

* Apenas **ADMIN** pode:

  * assumir mediação
  * enviar mensagens como admin
  * ver notas internas
  * fechar caso
* Tudo que for ação crítica: logar em `security_logs` (padrão que vocês já usam). 

---

## Modelo de dados (sugestão)

No `Caso`:

* `mediatedByAdminId` (nullable)
* `mediatedAt` (nullable)
* `closedByAdminId` (nullable)
* `closedAt` (nullable)
* `closeReason` (nullable enum)
* `closeSummary` (nullable text)

Novo modelo (recomendado) `case_messages` (ou reaproveitar `Mensagem` com escopo):

* `id`
* `caseId`
* `senderRole` (ADMIN | CIDADAO)
* `senderId`
* `message`
* `attachments[]` (ou tabela separada)
* `createdAt`
* `readAt` (por role)

E um campo `visibility` para nota interna:

* `PUBLIC` (admin↔cidadão)
* `INTERNAL` (somente admin)

---

## APIs (mínimas)

### Admin

* `POST /api/admin/casos/[id]/assume-mediation`
* `POST /api/admin/casos/[id]/messages` (envia msg admin)
* `GET  /api/admin/casos/[id]/messages` (lista)
* `POST /api/admin/casos/[id]/close` (fecha com motivo+resumo)
* `POST /api/admin/casos/[id]/notes` (nota interna) *(opcional se usar visibility)*

### Cidadão

* `GET  /api/cidadao/casos/[id]/admin-messages`
* `POST /api/cidadao/casos/[id]/admin-messages` (responder admin)

---

## UI no Admin (telas/ajustes)

No `/admin/casos/[id]` (ou drawer de detalhe):

* Header com:

  * Status
  * “Assumir mediação” / “Em mediação por X”
  * “Fechar caso”
* Tabs:

  * **Resumo**
  * **Conversas**
  * **Checklist**
  * **Notas internas**
  * **Auditoria do caso** (lista de logs ligados ao caso)

---

## Eventos/Analytics (se quiser medir)

* `admin_case_mediation_assumed`
* `admin_case_message_sent`
* `admin_case_closed`
* `citizen_replied_admin`
