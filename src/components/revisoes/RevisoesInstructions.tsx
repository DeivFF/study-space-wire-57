
import { BookOpen, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const RevisoesInstructions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Como Funciona o Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Algoritmo Inteligente:</h4>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span><strong>1-2 (Difícil):</strong> Intervalo reinicia para 1 dia</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span><strong>3 (Médio):</strong> Intervalo moderado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span><strong>4-5 (Fácil):</strong> Intervalo aumenta significativamente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                <span>Fator de facilidade se adapta automaticamente</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Benefícios:</h4>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Otimiza seu tempo de estudo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Foca nos conteúdos mais desafiadores</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Melhora a retenção de longo prazo</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>Adapta-se ao seu ritmo individual</span>
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RevisoesInstructions;
