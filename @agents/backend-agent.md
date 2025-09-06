# Backend Agent - APIs e Lógica de Negócio

## Responsabilidades

Este agente é especializado em:
- Desenvolvimento de APIs RESTful
- Lógica de negócio e validações
- Middleware e autenticação
- Integração com banco de dados

## Contexto do Projeto

### Estrutura Atual
- **Runtime:** Node.js com Express
- **Database:** PostgreSQL com driver pg
- **Auth:** JWT tokens com bcrypt
- **Validação:** Middleware customizado
- **Comando:** `cd backend && bun run dev` (porta 3002)

### APIs Existentes
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login
- `GET /api/profile/` - Perfil do usuário

## Tarefas Específicas

### 1. Estrutura de Pastas Backend

```
backend/
├── src/
│   ├── controllers/
│   │   ├── studyTypeController.js
│   │   ├── subjectController.js
│   │   └── lessonController.js
│   ├── models/
│   │   ├── StudyType.js
│   │   ├── Subject.js
│   │   └── Lesson.js
│   ├── routes/
│   │   ├── studyTypes.js
│   │   ├── subjects.js
│   │   └── lessons.js
│   ├── middleware/
│   │   ├── validation.js
│   │   └── auth.js
│   └── services/
│       └── studyService.js
```

### 2. Models (Camada de Dados)

#### StudyType Model
```javascript
class StudyType {
    static async create(userId, data) {
        const { name, description, color, icon } = data;
        const query = `
            INSERT INTO study_types (name, description, color, icon, user_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        return await db.query(query, [name, description, color, icon, userId]);
    }

    static async findByUser(userId) {
        const query = `
            SELECT st.*, 
                   COUNT(DISTINCT s.id) as subjects_count,
                   COUNT(l.id) as lessons_count,
                   COUNT(CASE WHEN l.completed = true THEN 1 END) as completed_lessons
            FROM study_types st
            LEFT JOIN subjects s ON st.id = s.study_type_id
            LEFT JOIN lessons l ON s.id = l.subject_id
            WHERE st.user_id = $1
            GROUP BY st.id
            ORDER BY st.created_at DESC
        `;
        return await db.query(query, [userId]);
    }

    static async findById(id, userId) {
        const query = `SELECT * FROM study_types WHERE id = $1 AND user_id = $2`;
        return await db.query(query, [id, userId]);
    }

    static async update(id, userId, data) {
        const { name, description, color, icon } = data;
        const query = `
            UPDATE study_types 
            SET name = $1, description = $2, color = $3, icon = $4
            WHERE id = $5 AND user_id = $6
            RETURNING *
        `;
        return await db.query(query, [name, description, color, icon, id, userId]);
    }

    static async delete(id, userId) {
        const query = `DELETE FROM study_types WHERE id = $1 AND user_id = $2`;
        return await db.query(query, [id, userId]);
    }
}
```

### 3. Controllers

#### StudyType Controller
```javascript
const studyTypeController = {
    async create(req, res) {
        try {
            const userId = req.user.id;
            const { name, description, color, icon } = req.body;

            // Validação
            if (!name || name.trim().length === 0) {
                return res.status(400).json({ error: 'Nome é obrigatório' });
            }

            const studyType = await StudyType.create(userId, {
                name: name.trim(),
                description,
                color,
                icon
            });

            res.status(201).json(studyType.rows[0]);
        } catch (error) {
            console.error('Erro ao criar tipo de estudo:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async getAll(req, res) {
        try {
            const userId = req.user.id;
            const studyTypes = await StudyType.findByUser(userId);
            res.json(studyTypes.rows);
        } catch (error) {
            console.error('Erro ao buscar tipos de estudo:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async getById(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const studyType = await StudyType.findById(id, userId);
            
            if (studyType.rows.length === 0) {
                return res.status(404).json({ error: 'Tipo de estudo não encontrado' });
            }

            res.json(studyType.rows[0]);
        } catch (error) {
            console.error('Erro ao buscar tipo de estudo:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async update(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { name, description, color, icon } = req.body;

            if (!name || name.trim().length === 0) {
                return res.status(400).json({ error: 'Nome é obrigatório' });
            }

            const studyType = await StudyType.update(id, userId, {
                name: name.trim(),
                description,
                color,
                icon
            });

            if (studyType.rows.length === 0) {
                return res.status(404).json({ error: 'Tipo de estudo não encontrado' });
            }

            res.json(studyType.rows[0]);
        } catch (error) {
            console.error('Erro ao atualizar tipo de estudo:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },

    async delete(req, res) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const result = await StudyType.delete(id, userId);

            if (result.rowCount === 0) {
                return res.status(404).json({ error: 'Tipo de estudo não encontrado' });
            }

            res.status(204).send();
        } catch (error) {
            console.error('Erro ao deletar tipo de estudo:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
};
```

### 4. Routes

#### Study Types Routes
```javascript
const express = require('express');
const router = express.Router();
const studyTypeController = require('../controllers/studyTypeController');
const authMiddleware = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// CRUD operations
router.post('/', studyTypeController.create);
router.get('/', studyTypeController.getAll);
router.get('/:id', studyTypeController.getById);
router.put('/:id', studyTypeController.update);
router.delete('/:id', studyTypeController.delete);

// Rota especial para estrutura hierárquica
router.get('/:id/structure', async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const query = `
            SELECT 
                st.id as study_type_id,
                st.name as study_type_name,
                st.color as study_type_color,
                json_agg(
                    json_build_object(
                        'id', s.id,
                        'name', s.name,
                        'color', s.color,
                        'order_index', s.order_index,
                        'lessons', s.lessons
                    ) ORDER BY s.order_index
                ) FILTER (WHERE s.id IS NOT NULL) as subjects
            FROM study_types st
            LEFT JOIN (
                SELECT s.*,
                       json_agg(
                           json_build_object(
                               'id', l.id,
                               'title', l.title,
                               'completed', l.completed,
                               'duration_minutes', l.duration_minutes,
                               'order_index', l.order_index
                           ) ORDER BY l.order_index
                       ) FILTER (WHERE l.id IS NOT NULL) as lessons
                FROM subjects s
                LEFT JOIN lessons l ON s.id = l.subject_id
                GROUP BY s.id, s.name, s.color, s.order_index, s.study_type_id
            ) s ON st.id = s.study_type_id
            WHERE st.id = $1 AND st.user_id = $2
            GROUP BY st.id, st.name, st.color
        `;

        const result = await db.query(query, [id, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tipo de estudo não encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao buscar estrutura:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
```

### 5. Middleware de Validação

#### Validation Middleware
```javascript
const Joi = require('joi');

const validationSchemas = {
    studyType: Joi.object({
        name: Joi.string().trim().min(1).max(255).required(),
        description: Joi.string().max(1000).allow('', null),
        color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).allow('', null),
        icon: Joi.string().max(100).allow('', null)
    }),

    subject: Joi.object({
        name: Joi.string().trim().min(1).max(255).required(),
        description: Joi.string().max(1000).allow('', null),
        color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).allow('', null),
        study_type_id: Joi.number().integer().positive().required(),
        order_index: Joi.number().integer().min(0).default(0)
    }),

    lesson: Joi.object({
        title: Joi.string().trim().min(1).max(255).required(),
        description: Joi.string().max(1000).allow('', null),
        content: Joi.string().allow('', null),
        subject_id: Joi.number().integer().positive().required(),
        duration_minutes: Joi.number().integer().min(0).allow(null),
        order_index: Joi.number().integer().min(0).default(0)
    })
};

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body);
        
        if (error) {
            return res.status(400).json({
                error: 'Dados inválidos',
                details: error.details.map(d => d.message)
            });
        }
        
        req.body = value;
        next();
    };
};

module.exports = {
    validateStudyType: validate(validationSchemas.studyType),
    validateSubject: validate(validationSchemas.subject),
    validateLesson: validate(validationSchemas.lesson)
};
```

### 6. Service Layer

#### Study Service
```javascript
class StudyService {
    static async getStudyProgress(userId, studyTypeId) {
        const query = `
            SELECT 
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
            WHERE st.id = $1 AND st.user_id = $2
        `;
        
        return await db.query(query, [studyTypeId, userId]);
    }

    static async reorderSubjects(userId, studyTypeId, subjectOrders) {
        const client = await db.connect();
        
        try {
            await client.query('BEGIN');
            
            for (const { id, order_index } of subjectOrders) {
                await client.query(
                    'UPDATE subjects SET order_index = $1 WHERE id = $2 AND study_type_id = $3 AND user_id = $4',
                    [order_index, id, studyTypeId, userId]
                );
            }
            
            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async duplicateStudyType(userId, studyTypeId) {
        const client = await db.connect();
        
        try {
            await client.query('BEGIN');
            
            // Duplicar tipo de estudo
            const studyTypeResult = await client.query(`
                INSERT INTO study_types (name, description, color, icon, user_id)
                SELECT name || ' (Cópia)', description, color, icon, user_id
                FROM study_types
                WHERE id = $1 AND user_id = $2
                RETURNING *
            `, [studyTypeId, userId]);

            const newStudyTypeId = studyTypeResult.rows[0].id;

            // Duplicar disciplinas
            const subjectsResult = await client.query(`
                INSERT INTO subjects (name, description, color, study_type_id, user_id, order_index)
                SELECT name, description, color, $1, user_id, order_index
                FROM subjects
                WHERE study_type_id = $2 AND user_id = $3
                RETURNING id, name
            `, [newStudyTypeId, studyTypeId, userId]);

            // Duplicar aulas
            for (const subject of subjectsResult.rows) {
                const originalSubject = await client.query(
                    'SELECT id FROM subjects WHERE name = $1 AND study_type_id = $2 AND user_id = $3',
                    [subject.name, studyTypeId, userId]
                );

                if (originalSubject.rows.length > 0) {
                    await client.query(`
                        INSERT INTO lessons (title, description, content, subject_id, user_id, order_index, duration_minutes)
                        SELECT title, description, content, $1, user_id, order_index, duration_minutes
                        FROM lessons
                        WHERE subject_id = $2 AND user_id = $3
                    `, [subject.id, originalSubject.rows[0].id, userId]);
                }
            }

            await client.query('COMMIT');
            return studyTypeResult.rows[0];
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
```

## APIs Endpoints

### Study Types
- `GET /api/study-types` - Listar tipos de estudo do usuário
- `POST /api/study-types` - Criar novo tipo de estudo
- `GET /api/study-types/:id` - Buscar tipo específico
- `PUT /api/study-types/:id` - Atualizar tipo de estudo
- `DELETE /api/study-types/:id` - Deletar tipo de estudo
- `GET /api/study-types/:id/structure` - Estrutura hierárquica completa
- `POST /api/study-types/:id/duplicate` - Duplicar tipo de estudo

### Subjects
- `GET /api/subjects?study_type_id=:id` - Listar disciplinas por tipo
- `POST /api/subjects` - Criar nova disciplina
- `GET /api/subjects/:id` - Buscar disciplina específica
- `PUT /api/subjects/:id` - Atualizar disciplina
- `DELETE /api/subjects/:id` - Deletar disciplina
- `PUT /api/subjects/reorder` - Reordenar disciplinas

### Lessons
- `GET /api/lessons?subject_id=:id` - Listar aulas por disciplina
- `POST /api/lessons` - Criar nova aula
- `GET /api/lessons/:id` - Buscar aula específica
- `PUT /api/lessons/:id` - Atualizar aula
- `DELETE /api/lessons/:id` - Deletar aula
- `PUT /api/lessons/:id/complete` - Marcar aula como concluída
- `PUT /api/lessons/reorder` - Reordenar aulas

## Entregáveis

### Código Backend
- Models para todas as entidades
- Controllers com validação completa
- Routes organizadas e documentadas
- Middleware de autenticação e validação
- Service layer para lógica complexa

### Testes
- Testes unitários para models
- Testes de integração para endpoints
- Mocks para banco de dados

### Documentação
- Swagger/OpenAPI spec
- Exemplos de requests/responses
- Guia de erro codes

## Validações e Regras de Negócio

### Autenticação
- Todas as rotas requerem JWT válido
- Usuário só acessa próprios dados

### Validação de Dados
- Nomes obrigatórios e não vazios
- Cores em formato hexadecimal
- IDs de referência existentes

### Regras de Negócio
- Soft delete para recuperação
- Ordem mantida automaticamente
- Progresso calculado em tempo real

## Performance

### Otimizações
- Conexão pool para PostgreSQL
- Cache de consultas frequentes
- Índices nas consultas principais
- Paginação para listas grandes

### Monitoramento
- Logs estruturados
- Métricas de performance
- Health checks