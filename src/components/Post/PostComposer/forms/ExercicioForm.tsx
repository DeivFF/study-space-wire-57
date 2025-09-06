import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TagInput } from '../TagInput';
import { 
  exercicioSchema, 
  type ExercicioFormData, 
  CATEGORIAS_MATERIA, 
  NIVEIS_DIFICULDADE,
  TIPOS_EXERCICIO 
} from '../schemas';

interface ExercicioFormProps {
  onSubmit: (data: ExercicioFormData) => Promise<boolean>;
  isLoading?: boolean;
  initialData?: Partial<ExercicioFormData>;
}

export const ExercicioForm: React.FC<ExercicioFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
}) => {
  const form = useForm<ExercicioFormData>({
    resolver: zodResolver(exercicioSchema),
    defaultValues: {
      type: 'exercicio',
      title: initialData?.title || '',
      content: initialData?.content || '',
      tags: initialData?.tags || [],
      isAnonymous: initialData?.isAnonymous || false,
      category: initialData?.category || null,
      data: {
        categoria_materia: initialData?.data?.categoria_materia || '',
        nivel_dificuldade: initialData?.data?.nivel_dificuldade || 'intermediario',
        tipo_exercicio: initialData?.data?.tipo_exercicio || 'dissertativo',
        resolucao_comentada: initialData?.data?.resolucao_comentada || '',
        fonte_exercicio: initialData?.data?.fonte_exercicio || '',
      },
    },
  });

  const handleSubmit = async (data: ExercicioFormData) => {
    const success = await onSubmit(data);
    if (success) {
      form.reset();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título do Exercício *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Dê um título descritivo ao exercício..."
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Um título claro ajuda outros estudantes a identificar o tipo de exercício
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Enunciado do Exercício *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Cole ou digite o enunciado completo do exercício. Inclua todas as informações necessárias para resolução..."
                    className="min-h-[120px] resize-none"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Inclua o enunciado completo, dados necessários e o que se pede
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Informações do Exercício</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="data.categoria_materia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria/Matéria *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={isLoading}>
                        <SelectValue placeholder="Selecione a matéria..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIAS_MATERIA.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data.nivel_dificuldade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível de Dificuldade</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={isLoading}>
                        <SelectValue placeholder="Selecione o nível..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NIVEIS_DIFICULDADE.map((nivel) => (
                        <SelectItem key={nivel.value} value={nivel.value}>
                          {nivel.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="data.tipo_exercicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Exercício</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={isLoading}>
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPOS_EXERCICIO.map((tipo) => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data.fonte_exercicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fonte do Exercício</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Livro XYZ, Prova ABC, Lista 2024..."
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    De onde veio este exercício? (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="data.resolucao_comentada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resolução Comentada</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Se você souber resolver, inclua a resolução passo a passo com explicações... (opcional)"
                    className="min-h-[100px] resize-none"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Compartilhe a resolução detalhada se você souber (opcional). Isso ajuda muito outros estudantes!
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <TagInput
                    tags={field.value}
                    onChange={field.onChange}
                    placeholder="Adicionar tag relacionada..."
                  />
                </FormControl>
                <FormDescription>
                  Adicione tags para facilitar a descoberta do exercício (máx. 10)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isAnonymous"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm font-medium">
                    Exercício Anônimo
                  </FormLabel>
                  <FormDescription>
                    Seu exercício será exibido sem mostrar seu nome
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? 'Compartilhando...' : 'Compartilhar Exercício'}
          </Button>
        </div>
      </form>
    </Form>
  );
};