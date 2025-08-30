# Posts API - Sistema Multiusuário

Este documento fornece exemplos de como usar as novas APIs de posts com suporte aos 4 tipos diferentes: `publicacao`, `duvida`, `exercicio` e `desafio`.

## Endpoints Disponíveis

### 1. Criar Posts

#### Publicação (Conteúdo geral)
```bash
POST /api/posts
# ou
POST /api/posts/publicacao

{
  "title": "Estudando React Hooks", // opcional
  "content": "Hoje aprendi sobre useState e useEffect...",
  "type": "publicacao", // opcional, default
  "category": "programacao", // opcional
  "tags": ["react", "javascript", "hooks"], // opcional
  "isAnonymous": false, // opcional, default false
  "data": {
    "tema": "React Development",
    "descricao_adicional": "Compartilhando experiência com hooks"
  }
}
```

#### Dúvida
```bash
POST /api/posts/duvida

{
  "title": "Como funciona o useEffect?", // obrigatório
  "content": "Estou com dificuldade para entender como o useEffect funciona...",
  "type": "duvida", // definido automaticamente pela rota
  "tags": ["react", "javascript", "duvida"],
  "isAnonymous": false,
  "data": {
    "categoria_materia": "programacao", // obrigatório
    "nivel_dificuldade": "intermediario", // obrigatório: iniciante, intermediario, avancado, especialista
    "tempo_estudo": "2 semanas", // opcional
    "recursos_utilizados": ["documentacao oficial", "tutoriais"], // opcional
    "tentativas_previas": "Já tentei ler a documentação mas não entendi" // opcional
  }
}
```

#### Exercício
```bash
POST /api/posts/exercicio

{
  "title": "Exercício: Criar um Todo List em React", // obrigatório
  "content": "Crie uma aplicação de lista de tarefas com as seguintes funcionalidades...",
  "type": "exercicio",
  "tags": ["react", "exercicio", "pratica"],
  "data": {
    "tipo_exercicio": "pratica", // obrigatório: pratica, teoria, projeto, desafio_codigo
    "nivel_dificuldade": "intermediario", // obrigatório
    "categoria_materia": "programacao", // opcional
    "tempo_estimado": "2 horas", // opcional
    "prerequisitos": ["conhecimento básico de React"], // opcional
    "recursos_necessarios": ["Node.js", "npm"], // opcional
    "solucao_disponivel": true, // opcional
    "pontuacao_maxima": 100 // opcional
  }
}
```

#### Desafio
```bash
POST /api/posts/desafio

{
  "title": "Hackathon de Algoritmos", // opcional
  "content": "Participe do nosso hackathon mensal de algoritmos...",
  "type": "desafio",
  "tags": ["hackathon", "algoritmos", "competicao"],
  "data": {
    "nivel_dificuldade": "avancado", // obrigatório
    "prazo_limite": "2024-02-15T23:59:59Z", // obrigatório (data futura)
    "categoria_materia": "programacao", // opcional
    "premiacao": "R$ 500 para o primeiro lugar", // opcional
    "criterios_avaliacao": ["eficiência", "legibilidade", "criatividade"], // opcional
    "max_participantes": 50, // opcional
    "tipo_desafio": "competitivo", // opcional: individual, grupo, competitivo, colaborativo
    "recursos_permitidos": ["qualquer linguagem", "bibliotecas padrão"] // opcional
  }
}
```

### 2. Buscar Posts

#### Feed do usuário
```bash
GET /api/posts/feed?limit=20&offset=0&type=duvida
```

#### Posts de um usuário específico
```bash
GET /api/posts/user/{userId}?limit=20&offset=0&type=exercicio
```

#### Post por ID
```bash
GET /api/posts/{postId}
```

#### Posts por tipo
```bash
GET /api/posts/type/duvida?limit=20&offset=0
GET /api/posts/type/exercicio?limit=20&offset=0
GET /api/posts/type/desafio?limit=20&offset=0
GET /api/posts/type/publicacao?limit=20&offset=0
```

#### Busca avançada com filtros
```bash
GET /api/posts/filter/advanced?type=duvida&categoriaMateria=programacao&nivelDificuldade=intermediario&tags=react,javascript&includeAnonymous=true&limit=20&offset=0
```

#### Busca por texto
```bash
GET /api/posts/search/query?q=react hooks&type=duvida&tags=javascript&limit=20&offset=0
```

#### Desafios ativos (com prazo futuro)
```bash
GET /api/posts/challenges/active?limit=20&offset=0
```

### 3. Atualizar Posts

```bash
PUT /api/posts/{postId}

{
  "title": "Título atualizado",
  "content": "Conteúdo atualizado...",
  "tags": ["nova", "tag"],
  "category": "nova_categoria",
  "data": {
    "campo_adicional": "valor"
  }
}
```

### 4. Deletar Posts

```bash
DELETE /api/posts/{postId}
```

### 5. Curtir/Descurtir Posts

```bash
POST /api/posts/{postId}/like
```

## Estruturas de Dados

### Resposta de Post
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Título do post",
    "content": "Conteúdo do post...",
    "type": "duvida",
    "data": {
      "categoria_materia": "programacao",
      "nivel_dificuldade": "intermediario"
    },
    "tags": ["react", "javascript"],
    "isAnonymous": false,
    "category": "programacao",
    "likesCount": 5,
    "commentsCount": 3,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "author": {
      "id": "uuid",
      "name": "João Silva",
      "nickname": "joao_dev",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
  }
}
```

### Post Anônimo
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Dúvida sobre algoritmos",
    "content": "Como posso melhorar meu conhecimento em algoritmos?",
    "type": "duvida",
    "data": {
      "categoria_materia": "programacao",
      "nivel_dificuldade": "iniciante"
    },
    "tags": ["algoritmos", "estudo"],
    "isAnonymous": true,
    "category": "programacao",
    "likesCount": 2,
    "commentsCount": 1,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "author": {
      "id": null,
      "name": "Usuário Anônimo",
      "nickname": null,
      "avatarUrl": null
    }
  }
}
```

## Rate Limiting

### Limites por Endpoint
- **Criação de posts**: 10 posts por 15 minutos
- **Posts anônimos**: 5 posts por 30 minutos
- **Desafios**: 3 desafios por hora
- **Interações (likes)**: 50 por 5 minutos
- **Buscas**: 30 por minuto

### Headers de Rate Limit
```
RateLimit-Limit: 10
RateLimit-Remaining: 7
RateLimit-Reset: 1642248600
```

## Validações

### Campos Obrigatórios por Tipo

#### Publicação
- `content` (mínimo 1, máximo 10.000 caracteres)

#### Dúvida
- `title` (mínimo 5, máximo 255 caracteres)
- `content` (mínimo 1, máximo 10.000 caracteres)
- `data.categoria_materia` (valor válido da lista)
- `data.nivel_dificuldade` (iniciante, intermediario, avancado, especialista)

#### Exercício
- `title` (mínimo 5, máximo 255 caracteres)
- `content` (mínimo 1, máximo 10.000 caracteres)
- `data.tipo_exercicio` (pratica, teoria, projeto, desafio_codigo)
- `data.nivel_dificuldade` (iniciante, intermediario, avancado, especialista)

#### Desafio
- `content` (mínimo 1, máximo 10.000 caracteres)
- `data.nivel_dificuldade` (iniciante, intermediario, avancado, especialista)
- `data.prazo_limite` (data futura em formato ISO)

### Categorias de Matéria Válidas
- matematica, fisica, quimica, biologia
- historia, geografia, portugues, literatura
- filosofia, sociologia, ingles, espanhol
- programacao, engenharia, medicina, direito
- administracao, economia, psicologia, artes
- musica, educacao_fisica, outros

## Códigos de Erro

- `400` - Dados de entrada inválidos
- `401` - Token de autenticação inválido
- `403` - Permissão negada
- `404` - Post não encontrado
- `429` - Rate limit excedido
- `500` - Erro interno do servidor

## Backward Compatibility

O sistema mantém total compatibilidade com posts existentes:
- Posts antigos são automaticamente tratados como tipo `publicacao`
- Endpoints antigos continuam funcionando
- Estrutura de resposta mantém campos originais
- Novos campos são opcionais e não quebram integrações existentes