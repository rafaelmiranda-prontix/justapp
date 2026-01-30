# 🔧 Setup do Stripe - LegalConnect

## Passo a Passo

### 1. Criar Conta no Stripe

1. Acesse [stripe.com](https://stripe.com)
2. Crie uma conta (modo de teste inicialmente)
3. Complete o onboarding

### 2. Criar Produtos e Preços

#### Produto: Plano Básico
1. Vá em **Products** → **Add product**
2. Nome: "Plano Básico - LegalConnect"
3. Preço: R$ 99,00 / mês (recurring)
4. Copie o **Price ID** (começa com `price_...`)

#### Produto: Plano Premium
1. Vá em **Products** → **Add product**
2. Nome: "Plano Premium - LegalConnect"
3. Preço: R$ 299,00 / mês (recurring)
4. Copie o **Price ID** (começa com `price_...`)

### 3. Configurar API Keys

1. Vá em **Developers** → **API keys**
2. Copie a **Secret key** (começa com `sk_...`)
3. Copie a **Publishable key** (começa com `pk_...`)

### 4. Configurar Webhook

1. Vá em **Developers** → **Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://seu-dominio.com/api/stripe/webhook`
4. Selecione os eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copie o **Signing secret** (começa com `whsec_...`)

### 5. Configurar Customer Portal

1. Vá em **Settings** → **Billing** → **Customer portal**
2. Ative o Customer Portal
3. Configure as opções:
   - Permitir cancelamento
   - Permitir atualização de método de pagamento
   - Permitir visualização de histórico

### 6. Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PREMIUM=price_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 7. Testar

#### Cartões de Teste
- Sucesso: `4242 4242 4242 4242`
- Falha: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

#### Testar Webhook Localmente
Use o Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Produção

1. Ative a conta no Stripe
2. Complete a verificação
3. Use as chaves de produção
4. Configure webhook em produção
5. Teste com valores reais pequenos primeiro

## Troubleshooting

### Webhook não funciona
- Verifique a URL do webhook
- Verifique o signing secret
- Use Stripe CLI para testar localmente

### Checkout não redireciona
- Verifique `NEXT_PUBLIC_APP_URL`
- Verifique os Price IDs
- Verifique logs do Stripe Dashboard

### Assinatura não ativa
- Verifique logs do webhook
- Verifique se o webhook está recebendo eventos
- Verifique se o advogadoId está no metadata
