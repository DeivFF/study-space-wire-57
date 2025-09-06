# Como Usar a Importação de Questões via CSV

## 📋 Visão Geral

O sistema permite importar questões em lote usando arquivos CSV. Esta funcionalidade é ideal para adicionar muitas questões de uma só vez, com validação automática de duplicatas.

## 🔧 Como Usar

### 1. **Preparar o Arquivo CSV**

Crie um arquivo CSV com as colunas obrigatórias. Use o arquivo de exemplo: `backend/data/exemplo-questoes.csv`

#### **Formato CSV Obrigatório:**
```
category,subcategory,title,content,type,year,difficulty,subject_area,legal_branch,exam_phase,institution,position,education_level,metadata,option_a,option_b,option_c,option_d,option_e,correct_option,explanation_a,explanation_b,explanation_c,explanation_d,explanation_e
```

#### **Campos Obrigatórios:**
- `category`: ENEM, OAB, CONCURSO
- `title`: Título único da questão
- `content`: Enunciado da questão
- `type`: OBJETIVA, DISCURSIVA, PECA_PRATICA
- `year`: Ano da questão (número)

#### **Campos Opcionais:**
- `subcategory`: Subcategoria específica
- `difficulty`: FACIL, MEDIO, DIFICIL
- `subject_area`: Área do conhecimento
- `legal_branch`: Para OAB (Civil, Penal, etc.)
- `exam_phase`: Para OAB (PRIMEIRA, SEGUNDA)
- `institution`: Banca/Órgão
- `position`: Cargo (para concursos)
- `education_level`: MEDIO, SUPERIOR
- `metadata`: JSON com dados extras
- `option_a` até `option_e`: Alternativas
- `correct_option`: Letra da resposta correta (A, B, C, D, E)
- `explanation_a` até `explanation_e`: Explicações das alternativas

### 2. **Executar a Importação**

```bash
cd backend

# Instalar dependências (se ainda não instalou)
npm install

# Rodar migration para criar constraint único (se ainda não rodou)
npm run migrate

# Importar questões do arquivo CSV
npm run import-questions data/exemplo-questoes.csv

# Ou usar caminho completo para seu arquivo
npm run import-questions /caminho/para/suas-questoes.csv
```

### 3. **Exemplo de Arquivo CSV**

```csv
category,subcategory,title,content,type,year,difficulty,subject_area,legal_branch,exam_phase,institution,position,education_level,metadata,option_a,option_b,option_c,option_d,option_e,correct_option,explanation_a,explanation_b,explanation_c,explanation_d,explanation_e
ENEM,,Função Linear,"Uma função f(x) = ax + b tem coeficiente angular a = 2 e passa pelo ponto (1, 3). O valor de f(0) é:",OBJETIVA,2023,MEDIO,Matemática,,,INEP,,MEDIO,"{""tema"":""Funções""}",0,1,2,3,4,B,"f(0) = a*0 + b = b, mas precisamos encontrar b","Como a = 2 e passa por (1,3): 3 = 2*1 + b, então b = 1, logo f(0) = 1","Incorreto","Incorreto","Incorreto"
OAB,,Direitos Fundamentais,"Sobre os direitos fundamentais na Constituição Federal de 1988, é correto afirmar:",OBJETIVA,2023,MEDIO,Direito Constitucional,Constitucional,PRIMEIRA,OAB,,SUPERIOR,"{""area"":""constitucional""}","São direitos absolutos","São cláusulas pétreas","Podem ser suspensos a qualquer momento","Não se aplicam aos estrangeiros","Não têm eficácia",B,"Os direitos fundamentais não são absolutos","Correto - são cláusulas pétreas do art. 60","Incorreto","Incorreto","Incorreto"
```

## 🎯 Comportamento do Sistema

### ✅ **O que o Sistema Faz:**

1. **Valida Campos Obrigatórios**: Pula registros sem title, category, content, type ou year
2. **Verifica Duplicatas**: Questões com o mesmo título são puladas automaticamente
3. **Valida Categorias**: Só aceita ENEM, OAB, CONCURSO
4. **Valida Tipos**: Só aceita OBJETIVA, DISCURSIVA, PECA_PRATICA
5. **Processa Alternativas**: Para questões objetivas, cria as opções automaticamente
6. **Relatório Detalhado**: Mostra quantas foram importadas, puladas, duplicadas ou com erro

### 📊 **Exemplo de Relatório:**

```
📊 IMPORT SUMMARY
==================================================
✅ Successfully imported: 45 questions
🔄 Duplicates skipped: 3 questions
⏭️  Records skipped: 2 questions
❌ Errors occurred: 0 questions
📝 Total processed: 50 records
==================================================
```

## 🚫 **Casos que são Pulados:**

- Questões sem título, categoria, conteúdo, tipo ou ano
- Questões com título duplicado (já existe no banco)
- Categorias inválidas (diferente de ENEM, OAB, CONCURSO)
- Tipos inválidos (diferente de OBJETIVA, DISCURSIVA, PECA_PRATICA)

## 🛠️ **Dicas Práticas:**

### **1. Preparando Dados no Excel/Google Sheets:**

1. Abra Excel ou Google Sheets
2. Crie colunas com os nomes exatos do formato
3. Preencha uma linha por questão
4. Para alternativas vazias, deixe a célula vazia
5. Para JSON metadata, use formato: `{"chave":"valor"}`
6. Salve como CSV (separado por vírgulas)

### **2. Testando com Poucas Questões:**

```bash
# Teste primeiro com o arquivo de exemplo
npm run import-questions data/exemplo-questoes.csv

# Verifique no banco se importou corretamente
# Depois importe seu arquivo completo
```

### **3. Preparando Grandes Volumes:**

```bash
# Para arquivos muito grandes, processe em lotes
# Exemplo: importe 100 questões por vez para monitorar
```

## ⚠️ **Importante:**

- **Backup**: Sempre faça backup do banco antes de importar grandes volumes
- **Títulos Únicos**: Cada questão deve ter um título único no sistema
- **Encoding**: Salve o CSV em UTF-8 para caracteres especiais
- **Aspas**: Se o conteúdo tiver vírgulas, o Excel adiciona aspas automaticamente
- **JSON**: Para metadata, use aspas duplas: `{"tema":"Funções"}`

## 🔍 **Verificando Resultados:**

```sql
-- Contar questões por categoria
SELECT category, COUNT(*) FROM questions GROUP BY category;

-- Ver últimas questões importadas
SELECT title, category, year, created_at FROM questions 
ORDER BY created_at DESC LIMIT 10;

-- Verificar questões específicas
SELECT * FROM questions WHERE title LIKE '%sua busca%';
```

## 🆘 **Resolução de Problemas:**

### **Erro: "File not found"**
- Verifique se o caminho do arquivo está correto
- Use caminho absoluto ou relativo ao diretório backend

### **Erro: "Missing required fields"**
- Verifique se todas as colunas obrigatórias estão preenchidas
- Confira se os nomes das colunas estão exatos

### **Erro: "Database connection"**
- Verifique se o backend está rodando
- Confirme se as migrations foram executadas

### **Muitas Duplicatas**
- Confira se você não está importando o mesmo arquivo novamente
- Use títulos mais específicos para distinguir questões similares

---

**💡 Pronto para usar!** Agora você pode importar centenas de questões de uma vez usando CSV.