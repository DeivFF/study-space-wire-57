# Plano de Execução: Sistema de Entrada Aprimorado para Salas Privadas/Públicas

## Análise do Problema

O sistema atual já possui **80% da infraestrutura necessária** implementada, mas ainda falta a **lógica de entrada diferenciada** entre salas públicas e privadas baseada no relacionamento de amizade. 

### Estado Atual da Infraestrutura

**✅ Backend Completo:**
- `room_access_requests` table com workflow completo (pending/approved/rejected)
- API methods: `requestAccess()`, `approveAccessRequest()`, `rejectAccessRequest()`
- Sistema de notificações via WebSocket funcionando
- Verificação de amizade na query `listRooms` já implementada

**✅ Frontend Base:**
- Hooks `useRequestAccess()`, `useJoinRoom()` funcionais
- Modal infrastructure existente
- Sistema de notificações integrado

**❌ Falta Implementar:**
- Lógica diferenciada de entrada baseada em relacionamento
- UI/UX para solicitação de acesso com feedback
- Componentes para notificações de aprovação/rejeição
- Fluxo automatizado para salas públicas

### Local do Problema

**Backend:** `C:\Users\User\Downloads\fazer-agora-voce-41-main\backend\src\controllers\roomsController.js`
- Método `joinRoom` (linha 234) - não verifica relacionamento de amizade
- Precisa implementar lógica condicional baseada em visibilidade + amizade

**Frontend:** `C:\Users\User\Downloads\fazer-agora-voce-41-main\src\components\Sala\FeedAndRoomsPanel.tsx`
- Método `onJoinRoom` (linha 173) - entrada direta sem verificar tipo de sala
- Falta modal de confirmação para salas privadas

## Plano de Implementação

### 1. **Modificar Lógica de Entrada no Backend (PRIORITÁRIO)**

**Arquivo:** `backend/src/controllers/roomsController.js`
**Método:** `joinRoom` (linha 234)

#### 1.1 Nova Lógica Condicional

```javascript
// Nova lógica para método joinRoom
static async joinRoom(req, res) {
  const client = await pool.connect();
  
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    
    await client.query('BEGIN');
    
    // Verificar se a sala existe
    const roomResult = await client.query(`
      SELECT id, name, visibility, current_members, owner_id
      FROM rooms 
      WHERE id = $1 AND is_active = true
    `, [roomId]);
    
    if (roomResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'NotFound', resource: 'room' });
    }
    
    const room = roomResult.rows[0];
    
    // Se é sala privada, verificar amizade com owner
    if (room.visibility === 'private') {
      const friendshipResult = await client.query(`
        SELECT id FROM user_connections 
        WHERE ((requester_id = $1 AND receiver_id = $2) OR 
               (receiver_id = $1 AND requester_id = $2))
        AND status = 'accepted'
      `, [userId, room.owner_id]);
      
      if (friendshipResult.rows.length === 0 && room.owner_id !== userId) {
        await client.query('ROLLBACK');
        return res.status(403).json({ 
          error: 'Forbidden', 
          msg: 'Você precisa ser amigo do proprietário para entrar nesta sala privada.',
          requiresPermission: true,
          roomInfo: {
            id: room.id,
            name: room.name,
            visibility: room.visibility
          }
        });
      }
    }
    
    // Se é sala pública com owner amigo, entrar diretamente
    if (room.visibility === 'public') {
      const friendshipResult = await client.query(`
        SELECT id FROM user_connections 
        WHERE ((requester_id = $1 AND receiver_id = $2) OR 
               (receiver_id = $1 AND requester_id = $2))
        AND status = 'accepted'
      `, [userId, room.owner_id]);
      
      if (friendshipResult.rows.length > 0 || room.owner_id === userId) {
        // Amigo do owner ou próprio owner - entrar diretamente
        // [continuar com lógica atual de joinRoom]
      } else {
        await client.query('ROLLBACK');
        return res.status(403).json({ 
          error: 'Forbidden', 
          msg: 'Apenas amigos do proprietário podem entrar nesta sala.',
          requiresFriendship: true
        });
      }
    }
    
    // Resto da lógica atual de joinRoom...
  }
}
```

### 2. **Criar Sistema de Solicitação com Modal (CRÍTICO)**

**Arquivo:** `src/components/Sala/AccessRequestModal.tsx` (NOVO)

#### 2.1 Componente Modal de Solicitação

```typescript
interface AccessRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: {
    id: string;
    name: string;
    visibility: 'public' | 'private';
    owner_name?: string;
  };
  onRequestAccess: (roomId: string, message?: string) => Promise<void>;
}

export function AccessRequestModal({ 
  isOpen, 
  onClose, 
  room, 
  onRequestAccess 
}: AccessRequestModalProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onRequestAccess(room.id, message);
      onClose();
    } catch (error) {
      console.error('Failed to request access:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Solicitar Acesso - {room.name}
          </DialogTitle>
          <DialogDescription>
            Esta sala {room.visibility === 'private' ? 'privada' : 'pública'} 
            pertence a {room.owner_name || 'um usuário'}. 
            Envie uma mensagem explicando por que deseja entrar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Textarea
            placeholder="Mensagem opcional (ex: Gostaria de estudar junto...)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={200}
          />
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Solicitar Acesso'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 3. **Atualizar Hooks para Nova Lógica (PRIORITÁRIO)**

**Arquivo:** `src/hooks/useRooms.tsx`

#### 3.1 Modificar `useJoinRoom` Hook

```typescript
export function useJoinRoom() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [pendingRoom, setPendingRoom] = useState<any>(null);

  return useMutation({
    mutationFn: async (roomId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Se requer permissão, armazenar info da sala
        if (error.requiresPermission || error.requiresFriendship) {
          setPendingRoom(error.roomInfo);
          throw new Error(JSON.stringify(error));
        }
        
        throw new Error(error.msg || 'Failed to join room');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Entrou na sala com sucesso!');
      setPendingRoom(null);
    },
    onError: (error: Error) => {
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.requiresPermission || errorObj.requiresFriendship) {
          // Não mostrar toast de erro - será tratado pelo modal
          return;
        }
      } catch {
        // Error normal
      }
      toast.error(error.message);
    },
  });
}
```

### 4. **Implementar Sistema de Notificações (CRÍTICO)**

**Arquivo:** `src/components/Sala/AccessRequestNotifications.tsx` (NOVO)

#### 4.1 Componente de Notificações de Solicitação

```typescript
export function AccessRequestNotifications() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!socket) return;
    
    // Notificação quando solicitação é aprovada
    const handleAccessApproved = ({ roomId, roomName, approvedBy }: any) => {
      toast.success(`Seu acesso à sala "${roomName}" foi aprovado!`);
      
      // Invalidar queries para atualizar lista de salas
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      
      // Redirecionar automaticamente se usuário quiser
      const autoJoin = confirm(`Deseja entrar na sala "${roomName}" agora?`);
      if (autoJoin) {
        window.location.href = `/sala/${roomId}`;
      }
    };
    
    // Notificação quando solicitação é rejeitada
    const handleAccessRejected = ({ roomName, rejectedBy, reason }: any) => {
      toast.error(`Seu acesso à sala "${roomName}" foi negado.`);
    };
    
    // Notificação para owner/moderator sobre nova solicitação
    const handleNewAccessRequest = ({ 
      roomId, 
      roomName, 
      requesterName, 
      requestId 
    }: any) => {
      toast(
        <div className="space-y-2">
          <p className="font-medium">Nova solicitação de acesso</p>
          <p className="text-sm">{requesterName} quer entrar na sala "{roomName}"</p>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={() => handleApproveRequest(roomId, requestId)}
            >
              Aprovar
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleRejectRequest(roomId, requestId)}
            >
              Negar
            </Button>
          </div>
        </div>,
        { duration: 10000 }
      );
    };
    
    socket.on('room:access_approved', handleAccessApproved);
    socket.on('room:access_rejected', handleAccessRejected);
    socket.on('room:access_requested', handleNewAccessRequest);
    
    return () => {
      socket.off('room:access_approved', handleAccessApproved);
      socket.off('room:access_rejected', handleAccessRejected);
      socket.off('room:access_requested', handleNewAccessRequest);
    };
  }, [socket, queryClient]);
  
  return null; // Componente apenas para side effects
}
```

### 5. **Atualizar Componente Principal (PRIORITÁRIO)**

**Arquivo:** `src/components/Sala/FeedAndRoomsPanel.tsx`

#### 5.1 Integrar Modal de Solicitação

```typescript
// Adicionar imports
import { AccessRequestModal } from './AccessRequestModal';
import { useRequestAccess } from '@/hooks/useRooms';

// Adicionar estados
const [accessModalOpen, setAccessModalOpen] = useState(false);
const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
const requestAccess = useRequestAccess();
const joinRoom = useJoinRoom();

// Modificar handleJoinRoom
const handleJoinRoom = async (room: Room) => {
  try {
    await joinRoom.mutateAsync(room.id);
  } catch (error: any) {
    try {
      const errorObj = JSON.parse(error.message);
      if (errorObj.requiresPermission || errorObj.requiresFriendship) {
        setSelectedRoom({
          ...room,
          owner_name: errorObj.roomInfo?.owner_name
        });
        setAccessModalOpen(true);
        return;
      }
    } catch {
      // Error normal já tratado pelo hook
    }
  }
};

// Adicionar handler para solicitação
const handleRequestAccess = async (roomId: string, message?: string) => {
  await requestAccess.mutateAsync({ roomId, message });
  setAccessModalOpen(false);
  setSelectedRoom(null);
};

// Adicionar modal no JSX
return (
  <>
    {/* Existing JSX */}
    
    <AccessRequestModal
      isOpen={accessModalOpen}
      onClose={() => {
        setAccessModalOpen(false);
        setSelectedRoom(null);
      }}
      room={selectedRoom}
      onRequestAccess={handleRequestAccess}
    />
  </>
);
```

### 6. **Modificações no Backend para WebSocket (OPCIONAL)**

**Arquivo:** `backend/src/controllers/roomsController.js`

#### 6.1 Emitir Eventos WebSocket

```javascript
// No método requestAccess - adicionar emissão para owner/moderadores
const io = req.app.get('io');
if (io) {
  // Buscar owner e moderadores da sala
  const moderatorsResult = await client.query(`
    SELECT user_id FROM room_members 
    WHERE room_id = $1 AND role IN ('owner', 'moderator')
  `, [roomId]);
  
  const userInfo = await client.query(`
    SELECT name FROM users WHERE id = $1
  `, [userId]);
  
  moderatorsResult.rows.forEach(mod => {
    io.to(`user:${mod.user_id}`).emit('room:access_requested', {
      roomId,
      roomName: room.name,
      requestId: accessRequestResult.rows[0].id,
      requesterName: userInfo.rows[0].name,
      timestamp: Date.now()
    });
  });
}

// No método approveAccessRequest - adicionar emissão para solicitante
if (io) {
  io.to(`user:${request.rows[0].user_id}`).emit('room:access_approved', {
    roomId,
    roomName: room.name,
    approvedBy: userId,
    timestamp: Date.now()
  });
}
```

### 7. **Testes de Validação (CRÍTICO)**

#### 7.1 Cenários de Teste

1. **Sala Pública + Amigos:**
   - Usuário A e B são amigos
   - A cria sala pública
   - B deve entrar automaticamente sem modal

2. **Sala Pública + Não Amigos:**
   - Usuário A e B não são amigos
   - A cria sala pública
   - B não deve conseguir ver/entrar na sala

3. **Sala Privada + Amigos:**
   - Usuário A e B são amigos
   - A cria sala privada
   - B deve ver modal de solicitação
   - A recebe notificação
   - A aprova → B entra automaticamente

4. **Sala Privada + Não Amigos:**
   - Usuário A e B não são amigos
   - A cria sala privada
   - B não deve conseguir ver a sala

5. **Fluxo de Aprovação/Rejeição:**
   - Solicitação pendente
   - Owner/moderator recebe notificação
   - Ações de aprovar/rejeitar funcionam
   - Solicitante recebe feedback

#### 7.2 Comandos de Teste

```bash
cd backend && bun run test
cd .. && npm run dev # Testar frontend
```

### 8. **Considerações de Performance**

#### 8.1 Índices Existentes (OK)

Os índices necessários já existem:
- `idx_user_connections_friendship` para verificações de amizade
- `idx_rooms_active_owner` para consultas de sala
- `idx_room_access_requests_status` para solicitações

#### 8.2 Cache Strategy

- Manter `staleTime: 30000` atual no React Query
- Invalidar cache quando status de solicitação muda
- Cache de relacionamentos de amizade já otimizado

### 9. **Cronograma Estimado**

- **Backend (Lógica condicional):** 3 horas
- **Frontend (Modais e componentes):** 4 horas
- **Hooks (Atualização):** 2 horas
- **WebSocket (Notificações):** 2 horas
- **Testes:** 3 horas
- **Integração e ajustes:** 2 horas

**Total estimado:** 16 horas

### 10. **Critérios de Aceitação**

☐ **Salas Públicas:** Amigos do owner entram automaticamente  
☐ **Salas Privadas:** Amigos do owner veem modal de solicitação  
☐ **Não amigos:** Não conseguem ver salas de outros usuários  
☐ **Notificações:** Owner/moderadores recebem solicitações em tempo real  
☐ **Aprovação:** Processo completo com redirecionamento automático  
☐ **Rejeição:** Feedback claro para solicitante  
☐ **UX:** Interface intuitiva sem confusão sobre tipos de sala  
☐ **Performance:** Tempos de resposta mantidos  
☐ **Compatibilidade:** Sistema atual não quebrado  

---

## Resumo da Implementação

### **Fluxo Desejado:**

1. **Usuário clica para entrar em sala:**
   - ✅ Se é sala pública + amigo: entra automaticamente
   - ✅ Se é sala privada + amigo: modal de solicitação
   - ✅ Se não é amigo: não vê a sala na lista

2. **Owner/moderador recebe solicitação:**
   - ✅ Notificação em tempo real via WebSocket
   - ✅ Botões de aprovar/rejeitar na notificação
   - ✅ Lista de solicitações pendentes na sala

3. **Resposta da solicitação:**
   - ✅ Se aprovada: usuário é automaticamente adicionado + redirecionado
   - ✅ Se rejeitada: usuário recebe feedback
   - ✅ Ambos casos atualizam o cache do React Query

**Status:** Pronto para implementação  
**Prioridade:** ALTA  
**Risk Level:** MÉDIO (envolve mudanças em múltiplos pontos, mas com rollback simples)