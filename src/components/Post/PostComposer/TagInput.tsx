import React, { useState, KeyboardEvent } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { tagSchema } from './schemas';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  maxTags = 10,
  placeholder = "Adicionar tag...",
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addTag = (value: string) => {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      return;
    }

    // Validar tag usando schema
    const validation = tagSchema.safeParse({ name: trimmedValue });
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    // Verificar se já existe
    if (tags.includes(trimmedValue)) {
      setError('Esta tag já foi adicionada');
      return;
    }

    // Verificar limite
    if (tags.length >= maxTags) {
      setError(`Máximo de ${maxTags} tags permitidas`);
      return;
    }

    onChange([...tags, trimmedValue]);
    setInputValue('');
    setError(null);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove última tag se input estiver vazio
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleAddClick = () => {
    addTag(inputValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex flex-wrap gap-2 min-h-[2rem]">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="px-3 py-1 text-sm flex items-center gap-1 max-w-full"
          >
            <span className="truncate">{tag}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => removeTag(tag)}
              aria-label={`Remover tag ${tag}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={tags.length >= maxTags ? `Máximo de ${maxTags} tags` : placeholder}
          disabled={tags.length >= maxTags}
          className={error ? 'border-destructive' : ''}
          maxLength={50}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddClick}
          disabled={!inputValue.trim() || tags.length >= maxTags}
          className="px-3"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {tags.length} de {maxTags} tags
        </span>
        <span>
          Pressione Enter para adicionar
        </span>
      </div>
    </div>
  );
};