import React, { useState } from 'react';
import { useSupabaseTopics } from '@/hooks/useSupabaseTopics';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingPage } from '@/components/ui/loading-spinner';
import { Trash2 } from 'lucide-react';

const Topics = () => {
  const {
    topics,
    isLoadingTopics,
    createTopic,
    isCreatingTopic,
    removeTopic,
  } = useSupabaseTopics();
  const [newTopicName, setNewTopicName] = useState('');

  const handleCreateTopic = () => {
    if (newTopicName.trim()) {
      createTopic(newTopicName.trim());
      setNewTopicName('');
    }
  };

  if (isLoadingTopics) {
    return <LoadingPage message="Carregando tópicos..." />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Gerenciar Tópicos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              type="text"
              placeholder="Novo tópico..."
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
              disabled={isCreatingTopic}
            />
            <Button onClick={handleCreateTopic} disabled={isCreatingTopic}>
              {isCreatingTopic ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>

          <div className="space-y-2">
            {topics && topics.length > 0 ? (
              topics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <span>{topic.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeTopic(topic.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">Nenhum tópico encontrado.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Topics;
