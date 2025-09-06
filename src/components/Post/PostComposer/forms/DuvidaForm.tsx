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
  duvidaSchema, 
  type DuvidaFormData, 
  CATEGORIAS_MATERIA, 
  NIVEIS_DIFICULDADE 
} from '../schemas';

interface DuvidaFormProps {
  onSubmit: (data: DuvidaFormData) => Promise<boolean>;
  isLoading?: boolean;
  initialData?: Partial<DuvidaFormData>;
}

export const DuvidaForm: React.FC<DuvidaFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
}) => {
  const form = useForm<DuvidaFormData>({
    resolver: zodResolver(duvidaSchema),
    defaultValues: {
      type: 'duvida',
      title: initialData?.title || '',
      content: initialData?.content || '',
      tags: initialData?.tags || [],
      isAnonymous: initialData?.isAnonymous || false,
      category: initialData?.category || null,
      data: {
        categoria_materia: initialData?.data?.categoria_materia || '',
        nivel_dificuldade: initialData?.data?.nivel_dificuldade || 'intermediario',
        contexto_academico: initialData?.data?.contexto_academico || '',
      },
    },
  });

  const handleSubmit = async (data: DuvidaFormData) => {
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
                <FormLabel>Título da Dúvida *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Resuma sua dúvida em poucas palavras..."
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Seja específico para facilitar que outros te ajudem
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
                <FormLabel>Descrição da Dúvida *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva sua dúvida detalhadamente. O que você já tentou? Onde tem dificuldade? Quanto mais contexto, melhor a ajuda que você receberá..."
                    className="min-h-[120px] resize-none"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Inclua o máximo de contexto possível: o que você já sabe, o que tentou, onde está com dificuldade
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Informações da Dúvida</h3>

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
                  <FormDescription>
                    Isso ajuda a encontrar pessoas experientes na área
                  </FormDescription>
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

          <FormField
            control={form.control}
            name="data.contexto_academico"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contexto Acadêmico</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Em qual contexto surgiu essa dúvida? (Ex: estudando para prova, fazendo exercício, lendo um livro...)"
                    className="min-h-[80px] resize-none"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Forneça contexto sobre quando/como surgiu a dúvida (opcional)
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
                  Adicione tags para facilitar que especialistas encontrem sua dúvida (máx. 10)
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
                    Dúvida Anônima
                  </FormLabel>
                  <FormDescription>
                    Sua dúvida será exibida sem mostrar seu nome
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
            {isLoading ? 'Enviando...' : 'Enviar Dúvida'}
          </Button>
        </div>
      </form>
    </Form>
  );
};