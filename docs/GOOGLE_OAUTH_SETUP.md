# Configuração do Google OAuth

Este guia explica como configurar o Google OAuth para autenticação na plataforma LegalMatch.

## 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Nomeie o projeto (ex: "LegalMatch")

## 2. Configurar Tela de Consentimento OAuth

1. No menu lateral, vá em **APIs & Services** → **OAuth consent screen**
2. Escolha **External** como tipo de usuário
3. Preencha as informações obrigatórias:
   - **App name:** LegalMatch
   - **User support email:** seu-email@gmail.com
   - **Developer contact information:** seu-email@gmail.com
4. Clique em **Save and Continue**
5. Em **Scopes**, adicione os escopos:
   - `userinfo.email`
   - `userinfo.profile`
6. Clique em **Save and Continue**
7. Em **Test users**, adicione seu email para testes
8. Clique em **Save and Continue**

## 3. Criar Credenciais OAuth 2.0

1. No menu lateral, vá em **APIs & Services** → **Credentials**
2. Clique em **Create Credentials** → **OAuth client ID**
3. Escolha **Web application** como tipo
4. Configure:
   - **Name:** LegalMatch Web Client
   - **Authorized JavaScript origins:**
     - `http://localhost:3000` (desenvolvimento)
     - `https://seu-dominio.com` (produção)
   - **Authorized redirect URIs:**
     - `http://localhost:3000/api/auth/callback/google` (desenvolvimento)
     - `https://seu-dominio.com/api/auth/callback/google` (produção)
5. Clique em **Create**
6. Copie o **Client ID** e **Client Secret**

## 4. Configurar Variáveis de Ambiente

Adicione as credenciais no arquivo `.env`:

```env
GOOGLE_CLIENT_ID="seu-client-id-aqui.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="seu-client-secret-aqui"
```

## 5. Testar Autenticação

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse a página de login e clique em "Entrar com Google"

3. Autorize o aplicativo com sua conta Google

4. Você deve ser redirecionado de volta à aplicação autenticado

## Troubleshooting

### Erro: redirect_uri_mismatch

Certifique-se de que a URL de redirect configurada no Google Cloud Console corresponde exatamente à URL usada pela aplicação.

### Erro: access_denied

Verifique se seu email está na lista de usuários de teste na tela de consentimento OAuth.

### Erro: Invalid client

Verifique se as variáveis `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão corretas no arquivo `.env`.

## Próximos Passos

Após configurar o Google OAuth:

1. Configure o `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

2. Adicione o secret gerado ao `.env`:
   ```env
   NEXTAUTH_SECRET="seu-secret-gerado"
   ```

3. Configure a URL base da aplicação:
   ```env
   NEXTAUTH_URL="http://localhost:3000"
   ```
