
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface QuestionBasicInfoProps {
  materia: string;
  assunto: string;
  enunciado: string;
  onMateriaChange: (value: string) => void;
  onAssuntoChange: (value: string) => void;
  onEnunciadoChange: (value: string) => void;
  disabled?: boolean;
}

const QuestionBasicInfo = ({
  materia,
  assunto,
  enunciado,
  onMateriaChange,
  onAssuntoChange,
  onEnunciadoChange,
  disabled = false
}: QuestionBasicInfoProps) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="materia">Matéria</Label>
          <Input
            id="materia"
            placeholder="Ex: Matemática"
            value={materia}
            onChange={(e) => onMateriaChange(e.target.value)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assunto">Assunto</Label>
          <Input
            id="assunto"
            placeholder="Ex: Geometria"
            value={assunto}
            onChange={(e) => onAssuntoChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="enunciado">Enunciado</Label>
        <Textarea
          id="enunciado"
          placeholder="Digite o enunciado da questão aqui..."
          value={enunciado}
          onChange={(e) => onEnunciadoChange(e.target.value)}
          rows={4}
          disabled={disabled}
        />
      </div>
    </>
  );
};

export default QuestionBasicInfo;
