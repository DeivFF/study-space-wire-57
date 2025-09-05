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
  desafioSchema, 
  type DesafioFormData, 
  CATEGORIAS_MATERIA, 
  NIVEIS_DIFICULDADE,
  TIPOS_DESAFIO 
} from '../schemas';

interface DesafioFormProps {
  onSubmit: (data: DesafioFormData) => Promise<boolean>;
  isLoading?: boolean;
  initialData?: Partial<DesafioFormData>;
}

export const DesafioForm: React.FC<DesafioFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
}) => {
  const form = useForm<DesafioFormData>({
    resolver: zodResolver(desafioSchema),
    defaultValues: {
      type: 'desafio',
      title: initialData?.title || '',
      content: initialData?.content || '',
      tags: initialData?.tags || [],
      isAnonymous: initialData?.isAnonymous || false,
      category: initialData?.category || null,
      data: {
        categoria_materia: initialData?.data?.categoria_materia || '',
        nivel_dificuldade: initialData?.data?.nivel_dificuldade || 'intermediario',
        prazo_limite: initialData?.data?.prazo_limite || '',
        criterios_avaliacao: initialData?.data?.criterios_avaliacao || '',
        recompensa: initialData?.data?.recompensa || '',
        tipo_desafio: initialData?.data?.tipo_desafio || 'individual',
      },
    },
  });

  const handleSubmit = async (data: DesafioFormData) => {
    const success = await onSubmit(data);
    if (success) {
      form.reset();
    }
  };

  // Função para gerar data mínima (amanhã)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
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
                <FormLabel>Título do Desafio *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Dê um nome motivador ao seu desafio..."
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Um título empolgante aumenta a participação no desafio
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
                <FormLabel>Descrição do Desafio *</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descreva o desafio em detalhes. O que os participantes precisam fazer? Quais são as regras? Como será a participação..."
                    className="min-h-[120px] resize-none"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Seja claro sobre o que se espera dos participantes e como funciona o desafio
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Configurações do Desafio</h3>

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
              name="data.tipo_desafio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Desafio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger disabled={isLoading}>
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TIPOS_DESAFIO.map((tipo) => (
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
              name="data.prazo_limite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo Limite</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      min={getMinDate()}
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Quando termina o prazo para participar? (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="data.criterios_avaliacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Critérios de Avaliação</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Como as respostas/participações serão avaliadas? Quais critérios usar para escolher os melhores? (opcional)"
                    className="min-h-[80px] resize-none"
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Explique como será feita a avaliação das participações (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="data.recompensa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recompensa</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Reconhecimento, certificado, material de estudo..."
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  Que recompensa ou reconhecimento os participantes receberão? (opcional)
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
                  Adicione tags para facilitar que interessados encontrem seu desafio (máx. 10)
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
                    Desafio Anônimo
                  </FormLabel>
                  <FormDescription>
                    Seu desafio será exibido sem mostrar seu nome
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
            {isLoading ? 'Criando...' : 'Criar Desafio'}
          </Button>
        </div>
      </form>
    </Form>
  );
};