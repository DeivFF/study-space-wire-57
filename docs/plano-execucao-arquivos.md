# Plano de Execução - Sistema de Gerenciamento de Arquivos

## Problema Identificado

**SITUAÇÃO ATUAL (❌)**: Quando uma aula é criada no sistema, automaticamente é criado um arquivo PDF fictício (ex: "Teste.pdf" para aula "teste"). O usuário relatou que **AINDA NÃO CONSEGUE INSERIR DOCUMENTOS**, indicando que a funcionalidade de upload não está funcionando.

**PROBLEMAS REPORTADOS**:
1. ❌ **Criação automática de PDF** - ainda acontece
2. ❌ **Upload não funciona** - usuário não consegue inserir documentos
3. ❌ **Arquivos não aparecem** - não são mostrados na seção "Arquivos anexados"

**OBJETIVOS**:
1. **Remover** a criação automática de PDF
2. **Corrigir** funcionalidade de seleção/drag-drop de arquivos  
3. **Garantir** que arquivos anexados apareçam na seção correspondente

## Análise Técnica Completa

### ✅ PROBLEMA 1: PDF Automático Identificado
- **Arquivo**: `src/contexts/StudyAppContext.tsx` (linhas 201-207)  
- **Problema**: No reducer `LOAD_LESSONS`, cada aula recebe automaticamente um resource PDF fictício
- **Solução**: Remover array de resources padrão

```typescript
// ANTES (❌)
resources: [
  { 
    id: `resource-${backendLesson.id}`, 
    type: 'pdf' as const, 
    name: `${backendLesson.title}.pdf` 
  }
],

// DEPOIS (✅)
resources: [],
```

### ✅ SISTEMA DE UPLOAD - INFRAESTRUTURA COMPLETA
**Frontend**:
- `src/components/StudyApp/LessonDetail/FilesTab.tsx` - UI drag-drop completa ✅
- `src/hooks/useFiles.ts` - Hook de gerenciamento ✅
- `src/services/studyApi.ts` - API client ✅

**Backend**:
- `backend/src/routes/lessons.js` - Rotas configuradas ✅
- `backend/src/controllers/lessonFilesController.js` - Controller completo ✅
- `backend/src/middleware/fileUpload.js` - Middleware multer ✅
- Suporte: PDF, áudio, imagens (até 100MB, máx 10 arquivos) ✅

### ❓ POSSÍVEIS CAUSAS DO PROBLEMA
1. **Backend não rodando** - Porta 3002
2. **Banco de dados** - Tabela `lesson_files` não existe
3. **Autenticação** - Token JWT inválido/expirado
4. **CORS** - Bloqueio de requisições
5. **Diretório uploads** - Permissões ou caminho inválido

## Plano de Execução REVISADO

### 🎯 ETAPA 1: Corrigir PDF Automático
- **Arquivo**: `src/contexts/StudyAppContext.tsx` (linha ~201)
- **Ação**: Alterar `resources: [...]` para `resources: []`
- **Tempo**: 2 minutos

### 🔍 ETAPA 2: Diagnosticar Problema de Upload
**2.1 Verificar Backend**
- Confirmar se backend está rodando (`cd backend && bun run dev`)
- Verificar porta 3002 acessível
- Testar endpoint: `GET http://localhost:3002/api/lessons/ID/files`

**2.2 Verificar Database**  
- Executar: `cd backend && bun run migrate`
- Confirmar tabela `lesson_files` existe
- Verificar estrutura das tabelas

**2.3 Verificar Autenticação**
- Checar token JWT no localStorage
- Verificar headers Authorization nas requests
- Testar login/token válido

### 🛠️ ETAPA 3: Testes Práticos
**3.1 Teste Manual Drag-Drop**
- Abrir FilesTab de uma aula
- Arrastar arquivo PDF pequeno (< 5MB)
- Monitorar Network tab (Dev Tools)
- Verificar resposta da API

**3.2 Teste Manual Seleção**
- Clicar "Selecionar arquivos"
- Escolher arquivo
- Verificar upload via progress bar
- Confirmar arquivo na lista

### 🐛 ETAPA 4: Debug Específico
- Verificar logs do console (F12)
- Verificar Network tab para erros HTTP
- Verificar toast messages de erro
- Analisar response da API

## Arquivos Envolvidos

### Principais
- `src/contexts/StudyAppContext.tsx` - Remover PDF automático
- `src/components/StudyApp/LessonDetail/FilesTab.tsx` - Sistema de arquivos
- `src/hooks/useFiles.tsx` - Hook de gerenciamento de arquivos

### Secundários (verificação)
- `backend/src/controllers/lessonsController.js` - API de arquivos
- `src/services/studyApi.ts` - Integração com backend

## ✅ Critérios de Sucesso

1. **PDF Automático Removido**: Aulas novas não criam PDF fictício
2. **Upload Funcional**: Drag-drop e seleção funcionam
3. **Arquivos Visíveis**: Aparecem em "Arquivos anexados"  
4. **Funcionalidades Completas**: Marcar principal, estudado, exclusão
5. **Feedback Visual**: Progress bars, toasts, loading states

## ⚠️ Checklist de Verificação

### Antes de Implementar
- [ ] Backend rodando em localhost:3002
- [ ] Database migrado e tabelas criadas
- [ ] Frontend rodando em localhost:8080
- [ ] Usuário autenticado com token válido

### Durante Debug
- [ ] Console sem erros JavaScript
- [ ] Network tab mostrando requests/responses
- [ ] Toast messages informando problemas
- [ ] Database com dados inseridos

### Após Correção  
- [ ] Upload drag-drop funciona
- [ ] Upload via botão funciona
- [ ] Arquivos aparecem na lista
- [ ] Funcionalidades (principal, estudado) funcionam
- [ ] Sem PDF automático em aulas novas

## 🚨 Principais Suspeitas

1. **Database**: Tabela `lesson_files` não migrada
2. **Backend**: Não está rodando ou com erro
3. **Auth**: Token expirado ou inválido
4. **CORS**: Frontend não consegue acessar API
5. **File Storage**: Diretório uploads com problemas

## ⏱️ Cronograma Revisado

- **Etapa 1 (PDF)**: 2 minutos
- **Etapa 2 (Diagnóstico)**: 10-15 minutos  
- **Etapa 3 (Testes)**: 10 minutos
- **Etapa 4 (Debug)**: 10-30 minutos (variável)

**Total Estimado**: 35-60 minutos (dependendo da complexidade do bug)