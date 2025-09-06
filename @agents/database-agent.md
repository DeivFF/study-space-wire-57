# Database Agent - Modelagem de Dados

## Responsabilidades

Este agente é especializado em:
- Modelagem e design de banco de dados
- Criação de migrations
- Otimização de consultas
- Definição de relacionamentos e constraints

## Contexto do Projeto

### Estrutura Atual
- **Database:** PostgreSQL
- **Migrations:** Executadas via `cd backend && bun run migrate`
- **ORM/Query Builder:** Queries diretas com pg driver

### Objetivo
Criar estrutura hierárquica para:
- **Tipos de Estudo** (ex: ENEM, Vestibular, Concursos)
- **Disciplinas** vinculadas aos tipos (ex: Matemática, Português)
- **Aulas** vinculadas às disciplinas (ex: Álgebra, Funções)

## Tarefas Específicas

### 1. Análise da Estrutura Atual
- [ ] Revisar migrations existentes em `backend/migrations/`
- [ ] Analisar schema atual e identificar tabelas relacionadas
- [ ] Verificar padrões de nomenclatura utilizados

### 2. Modelagem das Novas Entidades

#### Tabela: study_types
```sql
CREATE TABLE study_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color
    icon VARCHAR(100), -- icon name/path
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Tabela: subjects
```sql
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    study_type_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (study_type_id) REFERENCES study_types(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### Tabela: lessons (renomear/adaptar tabela atual se existir)
```sql
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT,
    subject_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    order_index INTEGER DEFAULT 0,
    duration_minutes INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. Índices e Otimizações
```sql
-- Índices para consultas frequentes
CREATE INDEX idx_study_types_user_id ON study_types(user_id);
CREATE INDEX idx_subjects_study_type_id ON subjects(study_type_id);
CREATE INDEX idx_subjects_user_id ON subjects(user_id);
CREATE INDEX idx_lessons_subject_id ON lessons(subject_id);
CREATE INDEX idx_lessons_user_id ON lessons(user_id);

-- Índice composto para ordenação
CREATE INDEX idx_subjects_study_type_order ON subjects(study_type_id, order_index);
CREATE INDEX idx_lessons_subject_order ON lessons(subject_id, order_index);
```

### 4. Triggers para Auditoria
```sql
-- Função para update de timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_study_types_updated_at 
    BEFORE UPDATE ON study_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at 
    BEFORE UPDATE ON subjects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at 
    BEFORE UPDATE ON lessons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5. Consultas Hierárquicas Otimizadas

#### Buscar estrutura completa
```sql
-- View para estrutura hierárquica completa
CREATE VIEW study_structure AS
SELECT 
    st.id as study_type_id,
    st.name as study_type_name,
    st.color as study_type_color,
    s.id as subject_id,
    s.name as subject_name,
    s.color as subject_color,
    l.id as lesson_id,
    l.title as lesson_title,
    l.completed as lesson_completed,
    l.duration_minutes
FROM study_types st
LEFT JOIN subjects s ON st.id = s.study_type_id
LEFT JOIN lessons l ON s.id = l.subject_id
WHERE st.user_id = $1
ORDER BY st.created_at, s.order_index, l.order_index;
```

#### Estatísticas de progresso
```sql
-- View para estatísticas de progresso
CREATE VIEW study_progress AS
SELECT 
    st.id as study_type_id,
    st.name as study_type_name,
    COUNT(DISTINCT s.id) as total_subjects,
    COUNT(l.id) as total_lessons,
    COUNT(CASE WHEN l.completed = true THEN 1 END) as completed_lessons,
    COALESCE(
        ROUND(
            (COUNT(CASE WHEN l.completed = true THEN 1 END) * 100.0) / 
            NULLIF(COUNT(l.id), 0), 
            2
        ), 0
    ) as progress_percentage
FROM study_types st
LEFT JOIN subjects s ON st.id = s.study_type_id
LEFT JOIN lessons l ON s.id = l.subject_id
WHERE st.user_id = $1
GROUP BY st.id, st.name
ORDER BY st.created_at;
```

## Entregáveis

### Arquivos de Migration
- `001_create_study_types.sql`
- `002_create_subjects.sql`
- `003_update_lessons_table.sql`
- `004_create_indexes.sql`
- `005_create_triggers.sql`
- `006_create_views.sql`

### Documentação
- Diagrama ER das relações
- Guia de consultas otimizadas
- Estratégias de backup e recovery

## Validações Necessárias

### Integridade dos Dados
- User só pode ver seus próprios dados
- Cascade deletes funcionando corretamente
- Order index mantém consistência

### Performance
- Consultas hierárquicas executam < 100ms
- Índices reduzem tempo de busca significativamente
- Views materializadas se necessário para dados pesados

## Próximos Passos

1. Criar arquivos de migration
2. Testar migrations em ambiente local
3. Validar performance das consultas
4. Documentar estrutura para backend-agent
5. Preparar dados de exemplo para testes