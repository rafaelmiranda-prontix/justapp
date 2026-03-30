-- CreateEnum
CREATE TYPE "ChatMode" AS ENUM ('MVP', 'PUSHER');

-- Insert default configuration for chat mode
INSERT INTO "configuracoes" (id, chave, valor, tipo, descricao, categoria, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'chat_mode',
  'MVP',
  'STRING',
  'Modo de funcionamento do chat: MVP (polling otimizado) ou PUSHER (WebSocket em tempo real)',
  'chat',
  NOW(),
  NOW()
) ON CONFLICT (chave) DO NOTHING;
