import React, { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { PostTypeSelector } from './PostTypeSelector';
import { PublicacaoForm } from './forms/PublicacaoForm';
import { DuvidaForm } from './forms/DuvidaForm';
import { ExercicioForm } from './forms/ExercicioForm';
import { DesafioForm } from './forms/DesafioForm';
import { usePostCreation } from './hooks/usePostCreation';
import type { PostFormData } from './schemas';

type PostComposerState = 'collapsed' | 'type-selection' | 'form' | 'loading' | 'success';

interface PostComposerProps {
  onPostCreated?: (post: any) => void;
  className?: string;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  onPostCreated,
  className = '',
}) => {
  const { user } = useAuth();
  const { createPost, isLoading, reset } = usePostCreation();
  const [state, setState] = useState<PostComposerState>('collapsed');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleExpand = useCallback(() => {
    if (!user) return;
    setState('type-selection');
    reset();
  }, [user, reset]);

  const handleCollapse = useCallback(() => {
    setState('collapsed');
    setSelectedType(null);
    reset();
  }, [reset]);

  const handleTypeSelect = useCallback((type: string) => {
    if (type === '') {
      setSelectedType(null);
      setState('type-selection');
    } else {
      setSelectedType(type);
      setState('form');
    }
  }, []);

  const handleSubmit = useCallback(async (data: PostFormData): Promise<boolean> => {
    setState('loading');
    const success = await createPost(data);
    
    if (success) {
      setState('success');
      onPostCreated?.(data);
      
      // Auto-collapse após 2 segundos
      setTimeout(() => {
        handleCollapse();
      }, 2000);
    } else {
      setState('form');
    }
    
    return success;
  }, [createPost, onPostCreated, handleCollapse]);

  const renderForm = () => {
    if (!selectedType) return null;

    const formProps = {
      onSubmit: handleSubmit,
      isLoading: isLoading || state === 'loading',
    };

    switch (selectedType) {
      case 'publicacao':
        return <PublicacaoForm {...formProps} />;
      case 'duvida':
        return <DuvidaForm {...formProps} />;
      case 'exercicio':
        return <ExercicioForm {...formProps} />;
      case 'desafio':
        return <DesafioForm {...formProps} />;
      default:
        return null;
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case 'collapsed':
        return <Plus className="h-4 w-4" />;
      case 'loading':
        return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      case 'success':
        return <span className="text-green-600">✓</span>;
      default:
        return <X className="h-4 w-4" />;
    }
  };

  const getStateText = () => {
    switch (state) {
      case 'collapsed':
        return 'Compartilhar conhecimento...';
      case 'type-selection':
        return 'Escolha o tipo de conteúdo';
      case 'form':
        return `Criar ${selectedType}`;
      case 'loading':
        return 'Criando post...';
      case 'success':
        return 'Post criado com sucesso!';
      default:
        return 'Novo post';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <Card className="shadow-sm border-border/50">
        <CardHeader 
          className={`cursor-pointer transition-colors hover:bg-accent/50 ${
            state === 'collapsed' ? 'pb-4' : 'pb-3'
          }`}
          onClick={state === 'collapsed' ? handleExpand : undefined}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getStateIcon()}
                <span className="text-base font-medium">
                  {getStateText()}
                </span>
              </div>
              {selectedType && state === 'form' && (
                <Badge variant="outline" className="text-xs">
                  {selectedType}
                </Badge>
              )}
            </div>
            
            {state !== 'collapsed' && (
              <div className="flex items-center gap-2">
                {state === 'form' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTypeSelect.bind(null, '')}
                    className="text-xs"
                  >
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Voltar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCollapse}
                  disabled={isLoading}
                >
                  {state === 'type-selection' ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>

        <AnimatePresence mode="wait">
          {state !== 'collapsed' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <Separator />
              <CardContent className="pt-6">
                {state === 'type-selection' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    <PostTypeSelector
                      selectedType={selectedType}
                      onTypeSelect={handleTypeSelect}
                    />
                  </motion.div>
                )}

                {state === 'form' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {renderForm()}
                  </motion.div>
                )}

                {state === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="text-center py-8"
                  >
                    <div className="text-4xl mb-3">🎉</div>
                    <h3 className="text-lg font-semibold text-green-600 mb-2">
                      Post criado com sucesso!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Seu conteúdo foi compartilhado na comunidade
                    </p>
                  </motion.div>
                )}

                {state === 'loading' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-8"
                  >
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">
                      Criando seu post...
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};