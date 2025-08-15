
import { RefreshCw } from 'lucide-react';

const RevisoesHeader = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl p-6 text-white">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <RefreshCw className="w-6 h-6" />
        Sistema de Revisões Inteligente
      </h2>
      <p className="text-blue-100">
        Otimize seu aprendizado com revisão espaçada baseada no algoritmo do Anki
      </p>
    </div>
  );
};

export default RevisoesHeader;
