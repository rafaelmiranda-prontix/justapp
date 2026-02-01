Com base no status atual da integração com o **Stripe** e no modelo de monetização já implementado no **JustApp**, estruturei a feature para gerenciar a visibilidade e o estado dos planos de assinatura.

Esta implementação permite validar o interesse dos usuários em planos superiores antes da liberação total das APIs de pagamento.

---

## 🚀 Feature: Gestão de Visibilidade e Planos Customizados

### 📋 Descrição Geral

Implementar um controle de estados para os planos de assinatura no Dashboard e na Landing Page. O sistema deve diferenciar planos ativos, planos em "coming soon" (Em Breve) e planos ocultos (Enterprise/Unlimited), além de introduzir a estrutura para o novo plano **Unlimited** focado em grandes volumes.

---

### 🎯 User Stories (US)

#### **US01 - Visualização de Planos "Em Breve"**

**Como** um Cidadão ou Advogado acessando a área de planos,

**Quero** ver os cards dos planos **BASIC** e **PREMIUM** com um rótulo de "Em Breve" e o botão de compra desabilitado,

**Para que** eu saiba quais funcionalidades serão liberadas no futuro próximo.

* **Critérios de Aceite:**
* Os cards BASIC e PREMIUM devem exibir o texto "Em Breve" no lugar do preço ou no botão.
* O botão de checkout para esses planos deve estar em estado `disabled`.



#### **US02 - Plano Oculto (Unlimited/Personalizado)**

**Como** Administrador do sistema,

**Quero** que o plano **UNLIMITED** não seja listado na grade de preços padrão para clientes comuns,

**Para que** eu possa tratar essa oferta como um plano de negociação direta via suporte.

* **Critérios de Aceite:**
* O plano UNLIMITED não deve ser renderizado no `map()` da lista de planos pública.
* Futuramente, este plano deve exibir um CTA "Contate-nos" em vez de um fluxo de checkout automático.



#### **US03 - Criação do Plano Ilimitado (Backend)**

**Como** Desenvolvedor,

**Quero** adicionar o modelo de plano **Unlimited** ao esquema do banco de dados e ao serviço de limites,

**Para que** o sistema suporte usuários sem restrições de leads quando o plano for ativado.

* **Critérios de Aceite:**
* Atualizar o `enum` de Planos no Prisma para incluir `UNLIMITED`.
* O `billing-service` deve ignorar a checagem de limites de leads para usuários com este plano.



---

### 🛠️ Plano de Implementação Técnica

1. **Configuração de Constantes (`src/lib/stripe-service.ts`):**
Adicionar uma propriedade `status` ao objeto de planos:
* `ACTIVE`: Plano funcional.
* `COMING_SOON`: Exibe card, mas bloqueia compra.
* `HIDDEN`: Não renderiza na lista.


2. **Lógica de Renderização (Frontend):**
```tsx
// Exemplo de lógica no componente de Planos
{planos.filter(p => p.status !== 'HIDDEN').map(plano => (
  <Card key={plano.id}>
    {plano.status === 'COMING_SOON' && <Badge>Em Breve</Badge>}
    <Button disabled={plano.status === 'COMING_SOON'}>
      {plano.status === 'COMING_SOON' ? 'Em Breve' : 'Assinar'}
    </Button>
  </Card>
))}

```


3. **Transição para Planos Personalizados:**
Preparar o card do plano **Unlimited** para que, quando for exibido, o link aponte para o WhatsApp de suporte ou formulário de contato, em conformidade com o desejo de "planos personalizados".

---

**Atualizar `STATUS_FINAL_100_COMPLETO.md`