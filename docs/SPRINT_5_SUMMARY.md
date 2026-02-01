# Sprint 5: Chat e Dashboards - Implementation Summary

## Overview
Sprint 5 implementa o sistema de chat em tempo real entre cidadãos e advogados, além dos componentes de interface para dashboards.

## What Was Implemented

### 1. Chat Service
**File**: [src/lib/chat.service.ts](src/lib/chat.service.ts)

**Core Functionality**:

#### `sendMessage()`
- Valida permissões (usuário deve fazer parte do match)
- **REGRA CRÍTICA**: Chat só liberado após match ACEITO
  - Exceção: Advogado pode enviar mensagem inicial se VISUALIZADO
  - Cidadão SEMPRE bloqueado até match ser ACEITO
- Valida tamanho (máx 5000 caracteres)
- Suporte a anexos (URL)
- Cria mensagem no banco
- Marca como não lida

#### `getMessages()`
- Lista mensagens de um match
- Valida permissões
- Paginação (limit/offset)
- Marca mensagens como lidas automaticamente
- Retorna total para paginação

#### `getUnreadCount()`
- Conta mensagens não lidas do usuário
- Funciona para cidadãos e advogados
- Útil para badge de notificações

#### `canSendAttachment()`
- Valida tamanho de arquivo
- Limite configurável (default: 20MB)

#### `findActiveMatch()`
- Busca match ativo entre cidadão e advogado
- Útil para abrir chat direto

### 2. Chat APIs

#### Send Message
**Endpoint**: `POST /api/chat/[matchId]/messages`
**Auth**: Required (CIDADAO or ADVOGADO)
**Body**:
```json
{
  "conteudo": "Olá, preciso de ajuda com meu caso",
  "anexoUrl": "https://..."  // optional
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "msg_123",
    "matchId": "match_123",
    "remetenteId": "user_123",
    "conteudo": "Olá...",
    "createdAt": "2026-01-30T12:00:00Z",
    "lida": false
  }
}
```

**Errors**:
- 401: Not authenticated
- 403: No permission (not part of match)
- 400: Match not ACEITO / empty message / too long

#### Get Messages
**Endpoint**: `GET /api/chat/[matchId]/messages?limit=50&offset=0`
**Auth**: Required
**Response**:
```json
{
  "success": true,
  "data": {
    "mensagens": [...],
    "total": 23,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

**Side Effect**: Marks unread messages as read

#### Get Unread Count
**Endpoint**: `GET /api/chat/unread`
**Auth**: Required
**Response**:
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

### 3. Chat UI Component
**File**: [src/components/chat/chat-window.tsx](src/components/chat/chat-window.tsx)

**Features**:
- Real-time message display
- Auto-scroll to latest message
- Message bubbles (own vs other)
- Timestamp formatting (pt-BR)
- Avatar display
- Send message form
- Loading states
- Polling (5s interval for updates)
- Support for attachments (view only for now)

**Props**:
```typescript
interface ChatWindowProps {
  matchId: string
  currentUserId: string
  otherUser: {
    name: string
    image?: string | null
  }
  onClose?: () => void
}
```

**Usage**:
```tsx
<ChatWindow
  matchId="match_123"
  currentUserId={session.user.id}
  otherUser={{
    name: "Dr. João Silva",
    image: "/avatar.jpg"
  }}
  onClose={() => setShowChat(false)}
/>
```

### 4. Lawyer Matches List Component
**File**: [src/components/lawyer/matches-list.tsx](src/components/lawyer/matches-list.tsx)

**Features**:
- Match cards with all details
- Status badges with icons
- Compatibility score badge
- Distance badge
- Urgency indicator (color-coded)
- Expiration warning (< 6h left)
- Case description preview
- Action buttons based on status:
  - **PENDENTE/VISUALIZADO**: Accept + Reject + Details
  - **ACEITO/CONTRATADO**: Open Chat + Details
  - **RECUSADO/EXPIRADO**: Details only
- Loading states
- Responsive design

**Props**:
```typescript
interface MatchesListProps {
  matches: Match[]
  onAccept: (matchId: string) => Promise<void>
  onReject: (matchId: string) => Promise<void>
  onViewDetails: (match: Match) => void
  onOpenChat: (matchId: string) => void
}
```

## Chat Access Rules

### Cidadão (Citizen)
```
Match Status:
  PENDENTE     → ❌ Bloqueado (aguardando advogado)
  VISUALIZADO  → ❌ Bloqueado (aguardando advogado)
  ACEITO       → ✅ Chat liberado
  CONTRATADO   → ✅ Chat liberado
  RECUSADO     → ❌ Bloqueado permanente
  EXPIRADO     → ❌ Bloqueado permanente
```

### Advogado (Lawyer)
```
Match Status:
  PENDENTE     → ❌ Bloqueado
  VISUALIZADO  → ✅ Pode enviar mensagem inicial (opcional)
  ACEITO       → ✅ Chat liberado
  CONTRATADO   → ✅ Chat liberado
  RECUSADO     → ❌ Bloqueado permanente
  EXPIRADO     → ❌ Bloqueado permanente
```

## Database Schema

### Mensagem Model
```prisma
model Mensagem {
  id          String   @id @default(cuid())
  matchId     String
  match       Match    @relation(...)
  remetenteId String   // UserId
  conteudo    String   @db.Text
  anexoUrl    String?
  lida        Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

**Indexes**:
- `matchId` - Fast message queries
- `remetenteId` - Fast sender queries

## Real-Time Updates

### Current Implementation: Polling
```typescript
// Poll every 5 seconds
const interval = setInterval(loadMessages, 5000)
return () => clearInterval(interval)
```

**Pros**:
- Simple to implement
- Works everywhere
- No extra dependencies

**Cons**:
- Not truly real-time
- Extra server load
- Network overhead

### Future Enhancement: WebSockets/Pusher
```typescript
// Pseudo-code for future implementation
import Pusher from 'pusher-js'

const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY)
const channel = pusher.subscribe(`match-${matchId}`)

channel.bind('new-message', (data) => {
  setMessages(prev => [...prev, data.message])
})
```

## User Experience Flows

### Flow 1: Lawyer Accepts Case
```
1. Lawyer sees match in dashboard (PENDENTE)
2. Clicks "Ver Detalhes" → sees full case info
3. Clicks "Aceitar Caso"
4. Match status → PENDENTE → ACEITO
5. "Aceitar Caso" button → "Abrir Chat"
6. Clicks "Abrir Chat"
7. ChatWindow opens
8. Lawyer sends first message
9. Citizen receives email notification
```

### Flow 2: Citizen Receives Acceptance
```
1. Email: "Dr. João aceitou seu caso!"
2. Citizen logs in → sees dashboard
3. Match card shows "ACEITO" badge
4. "Abrir Chat" button visible
5. Clicks "Abrir Chat"
6. ChatWindow opens with lawyer's message
7. Citizen replies
8. Conversation begins
```

### Flow 3: Multiple Lawyers Accept
```
1. Citizen has caso with 5 matches
2. Dr. João accepts (Hour 4)
3. Dra. Ana accepts (Hour 10)
4. Dr. Pedro doesn't respond → expires (Hour 48)
5. Citizen dashboard shows:
   - Dr. João (ACEITO) → Can chat
   - Dra. Ana (ACEITO) → Can chat
   - Dr. Pedro (EXPIRADO) → Not shown
6. Citizen chats with both
7. Decides to hire Dr. João
8. Marks match as CONTRATADO
9. Can still chat with Dra. Ana (backup)
```

## UI Components Integration

### Lawyer Dashboard Structure
```tsx
// src/app/(advogado)/advogado/dashboard/page.tsx

'use client'

export default function LawyerDashboard() {
  const [matches, setMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [showChat, setShowChat] = useState(false)

  const handleAccept = async (matchId) => {
    await fetch(`/api/matches/${matchId}/accept`, { method: 'POST' })
    // Reload matches
  }

  const handleReject = async (matchId) => {
    await fetch(`/api/matches/${matchId}/reject`, { method: 'POST' })
    // Reload matches
  }

  return (
    <div>
      <h1>Meus Casos</h1>

      {/* Tabs: Pendente | Aceito | Histórico */}

      <MatchesList
        matches={matches}
        onAccept={handleAccept}
        onReject={handleReject}
        onViewDetails={setSelectedMatch}
        onOpenChat={(matchId) => {
          setSelectedMatch(matchId)
          setShowChat(true)
        }}
      />

      {showChat && selectedMatch && (
        <Dialog open onOpenChange={setShowChat}>
          <ChatWindow
            matchId={selectedMatch.id}
            currentUserId={session.user.id}
            otherUser={selectedMatch.caso.cidadao.user}
            onClose={() => setShowChat(false)}
          />
        </Dialog>
      )}
    </div>
  )
}
```

### Citizen Dashboard Structure
```tsx
// src/app/(cidadao)/cidadao/dashboard/page.tsx

'use client'

export default function CitizenDashboard() {
  const [matches, setMatches] = useState([])
  const [selectedMatchId, setSelectedMatchId] = useState(null)

  const handleContratarAdvogado = async (matchId) => {
    // Mark as CONTRATADO
    await fetch(`/api/matches/${matchId}/contract`, { method: 'POST' })
  }

  return (
    <div>
      <h1>Meu Caso</h1>

      {/* Case details */}

      <h2>Advogados que Aceitaram</h2>

      {matches.filter(m => m.status === 'ACEITO').map(match => (
        <Card key={match.id}>
          <h3>{match.advogado.user.name}</h3>
          <p>Score: {match.score}%</p>
          <Button onClick={() => setSelectedMatchId(match.id)}>
            Abrir Chat
          </Button>
          <Button onClick={() => handleContratarAdvogado(match.id)}>
            Contratar
          </Button>
        </Card>
      ))}

      {selectedMatchId && (
        <Dialog open onOpenChange={() => setSelectedMatchId(null)}>
          <ChatWindow
            matchId={selectedMatchId}
            currentUserId={session.user.id}
            otherUser={/* lawyer info */}
          />
        </Dialog>
      )}
    </div>
  )
}
```

## Configuration Keys

Add to `Configuracao` table:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `chat_only_after_accept` | BOOLEAN | true | Bloquear chat antes de aceitar |
| `max_attachment_size_mb` | NUMBER | 20 | Tamanho máximo de anexo (MB) |
| `chat_message_max_length` | NUMBER | 5000 | Caracteres máximos por mensagem |
| `enable_real_time_updates` | BOOLEAN | false | WebSocket/Pusher (futuro) |

## Testing the Chat Flow

### 1. Setup Test Users
```sql
-- Lawyer
INSERT INTO users (email, name, role, status) VALUES
  ('lawyer@test.com', 'Dr. João Silva', 'ADVOGADO', 'ACTIVE');

-- Citizen
INSERT INTO users (email, name, role, status) VALUES
  ('citizen@test.com', 'Maria Santos', 'CIDADAO', 'ACTIVE');
```

### 2. Create Match and Accept
```bash
# Lawyer accepts match
POST /api/matches/{matchId}/accept
Authorization: Bearer {lawyer_jwt}
```

### 3. Citizen Tries to Send Message Before Accept
```bash
POST /api/chat/{matchId}/messages
Authorization: Bearer {citizen_jwt}
{
  "conteudo": "Olá!"
}

# Response: 400
{
  "success": false,
  "error": "Chat será liberado quando o advogado aceitar o caso"
}
```

### 4. After Accept - Both Can Chat
```bash
# Lawyer sends message
POST /api/chat/{matchId}/messages
Authorization: Bearer {lawyer_jwt}
{
  "conteudo": "Olá Maria! Analisando seu caso..."
}

# Response: 200 ✅

# Citizen replies
POST /api/chat/{matchId}/messages
Authorization: Bearer {citizen_jwt}
{
  "conteudo": "Obrigada Dr. João!"
}

# Response: 200 ✅
```

### 5. Check Unread Count
```bash
GET /api/chat/unread
Authorization: Bearer {citizen_jwt}

# Response
{
  "success": true,
  "data": {
    "unreadCount": 1
  }
}
```

### 6. Get Messages (Marks as Read)
```bash
GET /api/chat/{matchId}/messages
Authorization: Bearer {citizen_jwt}

# Returns all messages
# Side effect: unreadCount → 0
```

## Performance Considerations

### Message Loading
- Default limit: 50 messages
- Use pagination for long conversations
- Consider infinite scroll for UX

### Polling Interval
- Current: 5 seconds
- Adjust based on server load
- Consider exponential backoff when idle

### Database Queries
- Indexes on `matchId` and `remetenteId` critical
- Consider caching unread count (Redis)
- Archive old messages after case closes

## Security

### Authorization
✅ **Implemented**:
- User must be authenticated
- User must be part of match (cidadao or advogado)
- Match must be in valid status

❌ **Not Yet Implemented**:
- Rate limiting (prevent spam)
- Message content moderation
- Attachment virus scanning
- XSS prevention in message display

### Privacy
- Remetente ID is userId (not advogado/cidadao ID)
- Messages deleted when match deleted (CASCADE)
- No way to edit/delete messages yet

## Files Created

### Services:
- `src/lib/chat.service.ts` - Core chat logic

### APIs:
- `src/app/api/chat/[matchId]/messages/route.ts` - Send/get messages
- `src/app/api/chat/unread/route.ts` - Unread count

### Components:
- `src/components/chat/chat-window.tsx` - Chat UI
- `src/components/lawyer/matches-list.tsx` - Lawyer matches list

### Documentation:
- `SPRINT_5_SUMMARY.md` - This file

## Next Steps (Sprint 6)

1. **Complete Dashboards**
   - Finish lawyer dashboard page
   - Finish citizen dashboard page
   - Add filters and search
   - Add statistics cards

2. **File Upload**
   - Implement file upload endpoint
   - Use cloud storage (S3/Cloudinary)
   - Add progress indicator
   - Support multiple file types

3. **Real-Time Updates**
   - Implement Pusher/WebSocket
   - Remove polling
   - Add typing indicators
   - Add online/offline status

4. **Notifications**
   - Email when new message received
   - Email when match accepted
   - In-app notification center
   - Desktop notifications (PWA)

5. **Message Features**
   - Edit message (within 5 min)
   - Delete message
   - Message reactions
   - Link previews
   - Code formatting

6. **Search & Archive**
   - Search messages
   - Export conversation
   - Archive old chats
   - Starred messages

## Conclusion

Sprint 5 successfully implements the foundation of the chat system:

1. ✅ Chat service with business rules
2. ✅ Send/receive messages API
3. ✅ Access control (only after ACEITO)
4. ✅ Message read tracking
5. ✅ Unread count
6. ✅ Chat UI component
7. ✅ Lawyer matches list component

**The platform now has a functional communication channel between lawyers and citizens!** 🎉

Users can:
- Accept cases
- Start conversations
- Send messages
- View message history
- See unread count

Next sprint will complete the dashboards and add advanced features like file upload and real-time updates.
