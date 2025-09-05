import { z } from "zod";

// Base schema compartilhado por todos os tipos de post
const basePostSchema = z.object({
  content: z
    .string()
    .min(1, "Conteúdo é obrigatório")
    .max(10000, "Conteúdo deve ter no máximo 10.000 caracteres"),
  tags: z
    .array(z.string())
    .max(10, "Máximo de 10 tags permitidas")
    .optional()
    .default([]),
  isAnonymous: z.boolean().optional().default(false),
  category: z.string().optional().nullable(),
});

// Schema para Publicação
export const publicacaoSchema = basePostSchema.extend({
  type: z.literal("publicacao"),
  title: z
    .string()
    .min(1, "Título é obrigatório")
    .max(255, "Título deve ter no máximo 255 caracteres"),
  data: z
    .object({
      categoria_materia: z.string().optional(),
      fonte_referencia: z.string().optional(),
    })
    .optional()
    .default({}),
});

// Schema para Dúvida
export const duvidaSchema = basePostSchema.extend({
  type: z.literal("duvida"),
  title: z
    .string()
    .min(1, "Título da dúvida é obrigatório")
    .max(255, "Título deve ter no máximo 255 caracteres"),
  data: z
    .object({
      categoria_materia: z
        .string()
        .min(1, "Categoria da matéria é obrigatória"),
      nivel_dificuldade: z
        .enum(["iniciante", "intermediario", "avancado", "especialista"])
        .default("intermediario"),
      contexto_academico: z.string().optional(),
    })
    .required(),
});

// Schema para Exercício
export const exercicioSchema = basePostSchema.extend({
  type: z.literal("exercicio"),
  title: z
    .string()
    .min(1, "Título do exercício é obrigatório")
    .max(255, "Título deve ter no máximo 255 caracteres"),
  data: z
    .object({
      categoria_materia: z
        .string()
        .min(1, "Categoria da matéria é obrigatória"),
      nivel_dificuldade: z
        .enum(["iniciante", "intermediario", "avancado", "especialista"])
        .default("intermediario"),
      tipo_exercicio: z
        .enum(["multipla_escolha", "dissertativo", "pratico", "caso_estudo"])
        .default("dissertativo"),
      alternativas: z
        .array(z.object({
          letra: z.string(),
          texto: z.string(),
          correta: z.boolean()
        }))
        .optional(),
      resolucao_comentada: z.string().optional(),
      fonte_exercicio: z.string().optional(),
    })
    .required(),
});

// Schema para Desafio
export const desafioSchema = basePostSchema.extend({
  type: z.literal("desafio"),
  title: z
    .string()
    .min(1, "Título do desafio é obrigatório")
    .max(255, "Título deve ter no máximo 255 caracteres"),
  data: z
    .object({
      categoria_materia: z
        .string()
        .min(1, "Categoria da matéria é obrigatória"),
      nivel_dificuldade: z
        .enum(["iniciante", "intermediario", "avancado", "especialista"])
        .default("intermediario"),
      prazo_limite: z
        .string()
        .refine((date) => {
          const prazo = new Date(date);
          return prazo > new Date();
        }, "Prazo deve ser uma data futura")
        .optional(),
      criterios_avaliacao: z.string().optional(),
      recompensa: z.string().optional(),
      tipo_desafio: z
        .enum(["individual", "grupo", "competicao"])
        .default("individual"),
    })
    .required(),
});

// Schema para Enquete
export const enqueteSchema = basePostSchema.extend({
  type: z.literal("enquete"),
  title: z
    .string()
    .min(1, "Pergunta da enquete é obrigatória")
    .max(255, "Pergunta deve ter no máximo 255 caracteres"),
  data: z
    .object({
      poll_question: z
        .string()
        .min(1, "Pergunta da enquete é obrigatória"),
      poll_options: z
        .array(z.string())
        .min(2, "Mínimo de 2 opções necessárias")
        .max(8, "Máximo de 8 opções permitidas"),
      poll_multi: z.boolean().default(false),
      poll_duration: z.number().min(1).max(30).default(7),
    })
    .required(),
});

// Union type para todos os schemas
export const postSchema = z.discriminatedUnion("type", [
  publicacaoSchema,
  duvidaSchema,
  exercicioSchema,
  desafioSchema,
  enqueteSchema,
]);

// Tipos TypeScript derivados dos schemas
export type PublicacaoFormData = z.infer<typeof publicacaoSchema>;
export type DuvidaFormData = z.infer<typeof duvidaSchema>;
export type ExercicioFormData = z.infer<typeof exercicioSchema>;
export type DesafioFormData = z.infer<typeof desafioSchema>;
export type EnqueteFormData = z.infer<typeof enqueteSchema>;
export type PostFormData = z.infer<typeof postSchema>;

// Schema para validação de tags
export const tagSchema = z.object({
  name: z
    .string()
    .min(1, "Tag não pode estar vazia")
    .max(50, "Tag deve ter no máximo 50 caracteres")
    .regex(/^[a-zA-Z0-9\u00C0-\u017F\s-_]+$/, "Tag contém caracteres inválidos"),
});

// Constantes para opções dos selects
export const CATEGORIAS_MATERIA = [
  "Direito Constitucional",
  "Direito Penal",
  "Direito Civil",
  "Direito Administrativo",
  "Medicina",
  "Farmacologia",
  "Anatomia",
  "Fisiologia",
  "Engenharia",
  "Matemática",
  "Física",
  "Química",
  "História",
  "Geografia",
  "Literatura",
  "Filosofia",
  "Sociologia",
  "Psicologia",
  "Economia",
  "Administração",
  "Contabilidade",
  "Informática",
  "Programação",
  "Design",
  "Marketing",
  "Outros",
] as const;

export const NIVEIS_DIFICULDADE = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
] as const;

export const TIPOS_EXERCICIO = [
  { value: "multipla_escolha", label: "Múltipla Escolha" },
  { value: "dissertativo", label: "Dissertativo" },
  { value: "pratico", label: "Prático" },
  { value: "caso_estudo", label: "Estudo de Caso" },
] as const;

export const TIPOS_DESAFIO = [
  { value: "individual", label: "Individual" },
  { value: "grupo", label: "Grupo" },
  { value: "competicao", label: "Competição" },
] as const;

export const POST_TYPES = [
  {
    value: "publicacao",
    label: "Publicação",
    description: "Compartilhe conhecimentos, resumos e materiais de estudo",
    icon: "📚",
  },
  {
    value: "duvida",
    label: "Dúvida",
    description: "Faça perguntas e tire dúvidas com a comunidade",
    icon: "❓",
  },
  {
    value: "exercicio",
    label: "Exercício",
    description: "Compartilhe exercícios e questões para prática",
    icon: "📝",
  },
  {
    value: "desafio",
    label: "Desafio",
    description: "Crie desafios para testar conhecimentos da comunidade",
    icon: "🏆",
  },
  {
    value: "enquete",
    label: "Enquete",
    description: "Crie enquetes para coletar opiniões da comunidade",
    icon: "📊",
  },
] as const;