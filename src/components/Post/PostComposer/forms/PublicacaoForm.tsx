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
import { publicacaoSchema, type PublicacaoFormData, CATEGORIAS_MATERIA } from '../schemas';

interface PublicacaoFormProps {
  onSubmit: (data: PublicacaoFormData) => Promise<boolean>;
  isLoading?: boolean;
  initialData?: Partial<PublicacaoFormData>;
}

export const PublicacaoForm: React.FC<PublicacaoFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
}) => {
  const form = useForm<PublicacaoFormData>({
    resolver: zodResolver(publicacaoSchema),
    defaultValues: {
      type: 'publicacao',
      title: initialData?.title || '',
      content: initialData?.content || '',
      tags: initialData?.tags || [],
      isAnonymous: initialData?.isAnonymous || false,
      category: initialData?.category || null,
      data: {
        categoria_materia: initialData?.data?.categoria_materia || '',
        fonte_referencia: initialData?.data?.fonte_referencia || '',
      },
    },
  });

  const handleSubmit = async (data: PublicacaoFormData) => {
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
                <FormLabel>Título da Publicação *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Digite um título chamativo e descritivo..."
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Um bom título ajuda outros estudantes a encontrar seu conteúdo
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
                <FormLabel>Conteúdo *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Compartilhe seu conhecimento, resumos, dicas de estudo, materiais úteis..."
                    className="min-h-[120px] resize-none"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Compartilhe resumos, explicações, dicas ou qualquer conhecimento que possa ajudar outros estudantes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Informações Adicionais</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="data.categoria_materia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria/Matéria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={isLoading}>
                        <SelectValue placeholder="Selecione uma categoria..." />
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
              name="data.fonte_referencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fonte/Referência</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Livro, site, artigo..."
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Cite a fonte do seu material (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
                  Adicione tags para facilitar a descoberta do seu conteúdo (máx. 10)
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
                    Publicação Anônima
                  </FormLabel>
                  <FormDescription>
                    Sua publicação será exibida sem mostrar seu nome
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
            {isLoading ? 'Publicando...' : 'Publicar'}
          </Button>
        </div>
      </form>
    </Form>
  );
};