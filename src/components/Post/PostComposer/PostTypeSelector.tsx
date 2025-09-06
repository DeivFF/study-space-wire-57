import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { POST_TYPES } from './schemas';

interface PostTypeSelectorProps {
  selectedType: string | null;
  onTypeSelect: (type: string) => void;
  className?: string;
}

export const PostTypeSelector: React.FC<PostTypeSelectorProps> = ({
  selectedType,
  onTypeSelect,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-foreground">
          Que tipo de conteúdo você quer compartilhar?
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {POST_TYPES.map((type) => (
          <Card
            key={type.value}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedType === type.value
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-muted-foreground/50'
            }`}
            onClick={() => onTypeSelect(type.value)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl" role="img" aria-label={type.label}>
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm text-foreground">
                      {type.label}
                    </h4>
                    {selectedType === type.value && (
                      <Badge variant="default" className="text-xs px-2 py-0">
                        Selecionado
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {type.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedType && (
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="text-sm text-muted-foreground">
            Tipo selecionado: <strong>{POST_TYPES.find(t => t.value === selectedType)?.label}</strong>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTypeSelect('')}
            className="text-xs"
          >
            Alterar tipo
          </Button>
        </div>
      )}
    </div>
  );
};