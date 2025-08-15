import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

interface QuestionListProps {
  questions: Question[];
}

export const QuestionList = ({ questions }: QuestionListProps) => {
  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Nenhum exercício encontrado para esta aula.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question, index) => (
        <Card key={question.id} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-slate-50 p-4">
            <CardTitle className="text-base font-semibold">Questão {index + 1}</CardTitle>
            {question.explanation && (
                <Button variant="outline" size="sm" disabled>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Gabarito Comentado
                </Button>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <p className="font-medium mb-4">{question.question}</p>
            <div className="space-y-2">
              {question.options.map((option: string, optionIndex: number) => (
                <div
                  key={optionIndex}
                  className={`p-3 rounded-lg border text-sm ${
                    optionIndex === question.correct_answer
                      ? 'border-green-500 bg-green-50 font-medium text-green-800'
                      : 'border-gray-200'
                  }`}
                >
                  <span className="font-bold mr-2">
                    {String.fromCharCode(65 + optionIndex)})
                  </span>
                  {option}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
