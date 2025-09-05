# Plano de Melhorias: Sistema de Salas de Estudo

## Resumo Executivo
Este documento detalha o plano de implementação para resolver o bug de múltiplas saídas de salas e adicionar funcionalidade de configurações para donos de salas.

## Problemas Identificados

### 1. Bug: Sair da sala múltiplas vezes
**Sintoma**: Usuário consegue sair da sala apenas uma vez, depois não consegue mais sair.

**Causa Raiz Identificada**: 
- **Múltiplos pontos de saída**: `StudyRoomHeader.tsx:53-65` e `MembersPanel.tsx:51-59` ambos chamam `leaveRoomMutation`
- **Race condition**: Dois componentes podem chamar a API simultaneamente
- **Inconsistência de estado**: `Sala.tsx:328-346` tem `handleLeaveRoom` que apenas limpa estado local sem aguardar API
- **WebSocket dessincronia**: `leaveRoom(roomId)` pode executar antes do backend processar

**Arquivos Afetados**:
- `src/components/Sala/StudyRoomHeader.tsx` (linhas 53-65)
- `src/components/Sala/MembersPanel.tsx` (linhas 51-59, 235-249)  
- `src/pages/Sala.tsx` (linhas 328-346)

## Soluções Propostas

### 1. Correção do Bug de Múltiplas Saídas

#### 1.1 Centralizar Lógica de Saída
- **Remover** `handleLeaveRoom` duplicado do `MembersPanel.tsx:51-59`
- **Manter apenas** o botão de saída no `StudyRoomHeader.tsx`
- **Reutilizar** a mesma função `handleLeaveRoom` do header

#### 1.2 Sincronizar Estado com API
- **Modificar** `Sala.tsx:handleLeaveRoom` para aguardar sucesso da API antes de limpar estado
- **Implementar** debounce para prevenir múltiplas chamadas
- **Adicionar** loading state durante operação

#### 1.3 Melhorar Tratamento de Erro
- **Implementar** rollback em caso de falha na API
- **Adicionar** logs detalhados para debug
- **Tratar** casos edge de transferência de propriedade

### 2. Implementação de Configurações da Sala

#### 2.1 Botão de Configurações
**Localização**: `StudyRoomHeader.tsx`
**Visibilidade**: Apenas para `userRole === 'owner'`
**Posição**: Após o botão "Excluir Sala"

#### 2.2 Modal de Configurações
**Novo Componente**: `src/components/Sala/RoomSettingsModal.tsx`
**Campos Editáveis**:
- Nome da sala (3-50 caracteres)
- Descrição (máx 200 caracteres) 
- Privacidade (público/privado)

#### 2.3 API Backend
**Endpoint Necessário**: `PUT /api/rooms/:id/settings`
**Validações**:
- Apenas owner pode modificar
- Validar comprimento dos campos
- Verificar se nome não está em uso

## Cronograma de Implementação

### Fase 1: Correção do Bug (Prioridade Alta)
**Duração**: 2-3 horas
1. ✅ **Análise completa** - Identificar causa raiz
2. **Refatoração** - Centralizar lógica de saída (30min)
3. **Sincronização** - Aguardar API antes de limpar estado (45min)  
4. **Testes** - Validar cenários de saída múltipla (45min)
5. **Logs** - Adicionar debug detalhado (15min)

### Fase 2: Implementação de Configurações (Prioridade Média)
**Duração**: 4-5 horas
1. **Backend API** - Endpoint de atualização de sala (90min)
2. **Modal Component** - Interface de configurações (120min)
3. **Header Integration** - Botão visível apenas ao owner (30min)
4. **Form Validation** - Validação frontend (45min)
5. **Error Handling** - Tratamento de erros (30min)
6. **Testing** - Testes de todas as funcionalidades (45min)

## Arquivos a Serem Modificados

### Frontend
```
src/
├── components/Sala/
│   ├── StudyRoomHeader.tsx          (modificar - botão configurações)
│   ├── MembersPanel.tsx             (modificar - remover botão duplicado)
│   ├── RoomSettingsModal.tsx        (criar - modal configurações)
│   └── LeaveRoomModal.tsx           (verificar - pode precisar ajustes)
├── pages/
│   └── Sala.tsx                     (modificar - handleLeaveRoom)
└── hooks/
    └── useRooms.tsx                 (modificar - adicionar useUpdateRoom)
```

### Backend
```
backend/src/
├── controllers/
│   └── roomsController.js           (modificar - adicionar updateRoom)
└── routes/
    └── rooms.js                     (modificar - adicionar PUT /settings)
```

## Critérios de Sucesso

### Bug de Múltiplas Saídas
- [ ] Usuário pode sair da sala quantas vezes quiser
- [ ] Não há race conditions entre componentes
- [ ] Estado da aplicação fica consistente após saída
- [ ] WebSocket é corretamente desconectado
- [ ] Erros são tratados adequadamente

### Configurações da Sala
- [ ] Botão visível apenas para donos
- [ ] Modal abre com dados atuais da sala
- [ ] Validação funciona corretamente
- [ ] API atualiza dados no banco
- [ ] Interface reflete mudanças instantaneamente
- [ ] Outros membros veem mudanças em tempo real

## Considerações Técnicas

### Performance
- Usar debounce de 300ms em chamadas de API
- Invalidar queries do React Query após atualizações
- Implementar loading states consistentes

### Segurança  
- Validar permissões no backend
- Sanitizar inputs antes de salvar
- Rate limiting em endpoints sensíveis

### UX/UI
- Feedback visual durante operações
- Mensagens de erro claras
- Transições suaves entre estados

## Riscos e Mitigações

### Risco 1: Race Conditions
**Mitigação**: Implementar debounce e loading states

### Risco 2: Inconsistência de Estado
**Mitigação**: Aguardar API antes de limpar estado local

### Risco 3: Conflitos de Permissão  
**Mitigação**: Validação dupla (frontend + backend)

### Risco 4: Quebra de Funcionalidade Existente
**Mitigação**: Testes extensivos em cenários edge

## Próximos Passos
1. Aprovação do plano pelo usuário
2. Implementação da Fase 1 (correção do bug)
3. Testes e validação da correção
4. Implementação da Fase 2 (configurações)
5. Testes finais e deploy

## Observações
- Seguir padrões existentes do projeto (TypeScript, Tailwind, Radix UI)
- Manter consistência com componentes existentes
- Documentar mudanças significativas
- Usar agentes especializados conforme necessário