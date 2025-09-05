# Plano de Execução - Redesign do Sistema de Notificação

## Análise do Design Atual vs Novo

### Design Atual (NotificationDropdown.tsx)
- **Localização**: Dropdown que abre do header
- **Layout**: Lista vertical com scroll
- **Tamanho**: 384px de largura (w-96), altura fixa
- **Cores**: Sistema de cores padrão do projeto
- **Componentes**: Avatar, Badge, Button, ScrollArea

### Design Alvo (html.html)
- **Localização**: Bell fixo no canto superior direito
- **Layout**: Menu dropdown com design minimalista
- **Estilo**: Design mais limpo e moderno
- **Cores**: Verde substituído pelo azul do projeto (#2962ff)
- **Funcionalidades**: Dropdown comportament, animações suaves

## Modificações Necessárias

### 1. Estrutura do Componente
**Arquivo**: `src/components/Feed/NotificationDropdown.tsx`

#### Mudanças de Layout:
- Alterar posicionamento para `fixed` no canto superior direito
- Implementar o componente bell como trigger separado
- Redesenhar o menu dropdown com novo layout

#### Mudanças de Estilo:
- Substituir classes Tailwind por classes CSS customizadas
- Implementar grid layout para items (40px + 1fr)
- Adicionar animação de "pop" para abertura do menu

### 2. Estilos CSS Customizados
**Arquivo**: `src/components/Feed/NotificationStyles.css` (criar novo)

#### Implementar:
- `.bell-wrap` - Container fixo para o bell
- `.btn`, `.btn-icon`, `.btn-primary`, `.btn-xs` - Botões customizados
- `.menu`, `.menu-header`, `.menu-body`, `.menu-footer` - Layout do menu
- `.item`, `.avatar`, `.icon` - Items de notificação
- `.badge` - Badge de contador
- Animação `@keyframes pop`

### 3. Adaptação de Cores
#### Substituições de cor verde (#1e8e3e) por azul do projeto:
- `--ok: #2962ff` (light mode)
- `--ok: #6ea8fe` (dark mode)
- `.btn-primary` usa `--ok` como background
- Manter outras cores do design (danger, warning, etc)

### 4. Funcionalidades JavaScript
#### Implementar comportamentos:
- Toggle do dropdown (abrir/fechar)
- Click outside para fechar
- Tecla Escape para fechar
- Contagem de notificações não lidas
- Ações: marcar como lida, aceitar, rejeitar
- Refresh automático do contador

## Cronograma de Implementação

### Fase 1: Preparação
1. **Criar arquivo de estilos CSS** - `NotificationStyles.css`
2. **Definir variáveis CSS** com cores do projeto
3. **Estruturar componentes base** (bell, menu, items)

### Fase 2: Layout e Visual  
1. **Implementar layout grid** para items de notificação
2. **Aplicar estilos do design** (bordas, sombras, cores)
3. **Adicionar animações** (pop, hover effects)
4. **Implementar responsive design** para mobile

### Fase 3: Funcionalidades
1. **Adaptar lógica existente** para novo layout
2. **Implementar comportamento do dropdown**
3. **Integrar com hooks existentes** (useNotifications)
4. **Adicionar tratamento de estados** (loading, empty)

### Fase 4: Integração
1. **Testar em diferentes telas** (desktop, tablet, mobile)
2. **Verificar acessibilidade** (aria labels, keyboard navigation)
3. **Validar tema claro/escuro**
4. **Ajustar posicionamento** se necessário

## Arquivos a Modificar

### Principais
1. `src/components/Feed/NotificationDropdown.tsx` - Componente principal
2. `src/components/Feed/NotificationStyles.css` - Estilos novos (criar)
3. `src/components/Feed/FeedHeader.tsx` - Integração do bell

### Secundários  
1. `src/hooks/useNotifications.tsx` - Ajustes se necessário
2. `src/lib/notification-seeds.ts` - Dados de teste
3. `src/index.css` - Variáveis CSS globais (se necessário)

## Considerações Técnicas

### Responsividade
- Ajustar largura do menu em telas pequenas (`min(460px, 92vw)`)
- Manter usabilidade em dispositivos touch
- Preservar acessibilidade

### Performance
- Manter lazy loading de notificações
- Otimizar re-renders com React.memo
- Usar debounce para ações rápidas

### Acessibilidade
- Manter aria-labels e roles
- Suporte a navegação por teclado
- Contraste adequado de cores
- Screen reader friendly

## Validação do Resultado

### Critérios de Sucesso
✓ Visual idêntico ao design de referência (exceto cores)  
✓ Verde substituído pelo azul do projeto (#2962ff)  
✓ Funcionalidades existentes preservadas  
✓ Responsivo em todas as telas  
✓ Acessível e compatível com themes  
✓ Performance mantida ou melhorada  

### Testes Necessários
- [ ] Visual testing em diferentes browsers
- [ ] Teste de usabilidade mobile
- [ ] Validação de acessibilidade
- [ ] Teste de performance
- [ ] Verificação tema claro/escuro