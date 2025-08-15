import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, Edit, Trash2, Upload, Download, Loader2, FileUp } from 'lucide-react';
import { useSupabaseLessonTranscriptions } from '@/hooks/useSupabaseLessonTranscriptions';

interface TranscriptionSegment {
  id: string;
  start_time: number;
  end_time: number;
  text: string;
}

interface AudioTranscriptionProps {
  lessonId: string;
  lessonTitle: string;
  currentTime: number;
  isOpen: boolean;
  onClose: () => void;
}

const AudioTranscription = ({ lessonId, lessonTitle, currentTime, isOpen, onClose }: AudioTranscriptionProps) => {
  const [showAddSegment, setShowAddSegment] = useState(false);
  const [editingSegment, setEditingSegment] = useState<TranscriptionSegment | null>(null);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [showSrtImport, setShowSrtImport] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [srtFile, setSrtFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [newSegment, setNewSegment] = useState({
    start_time: '',
    end_time: '',
    text: ''
  });
  const { toast } = useToast();
  
  const {
    segments,
    loading,
    saveSegment,
    updateSegment,
    deleteSegment,
    bulkImportSegments,
    clearAllSegments
  } = useSupabaseLessonTranscriptions(lessonId);

  // Função para converter tempo "HH:MM:SS" para segundos
  const timeToSeconds = (timeStr: string): number => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    
    const parts = timeStr.split(':');
    if (parts.length !== 3) return 0;
    
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    const seconds = parseInt(parts[2]) || 0;
    
    return hours * 3600 + minutes * 60 + seconds;
  };

  // Função para converter segundos para formato "HH:MM:SS"
  const secondsToTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Função para converter tempo SRT "HH:MM:SS,mmm" para segundos
  const srtTimeToSeconds = (timeStr: string): number => {
    const [time, milliseconds] = timeStr.split(',');
    const [hours, minutes, seconds] = time.split(':').map(Number);
    const ms = parseInt(milliseconds) || 0;
    
    return hours * 3600 + minutes * 60 + seconds + ms / 1000;
  };

  // Função para parsear arquivo SRT
  const parseSrtFile = (content: string): Omit<TranscriptionSegment, 'id'>[] => {
    const segments: Omit<TranscriptionSegment, 'id'>[] = [];
    const blocks = content.trim().split(/\n\s*\n/);
    
    for (const block of blocks) {
      const lines = block.trim().split('\n');
      if (lines.length < 3) continue;
      
      // Linha 1: número do segmento (ignoramos)
      // Linha 2: timestamps
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/);
      if (!timeMatch) continue;
      
      const startTime = srtTimeToSeconds(timeMatch[1]);
      const endTime = srtTimeToSeconds(timeMatch[2]);
      
      // Linhas 3+: texto (pode ter múltiplas linhas)
      const text = lines.slice(2).join(' ').trim();
      
      if (text && startTime < endTime) {
        segments.push({
          start_time: startTime,
          end_time: endTime,
          text: text
        });
      }
    }
    
    return segments;
  };

  const handleSrtFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.toLowerCase().endsWith('.srt')) {
      setSrtFile(file);
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos .srt",
        variant: "destructive"
      });
    }
  };

  const handleImportSrt = async () => {
    if (!srtFile) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo SRT",
        variant: "destructive"
      });
      return;
    }

    try {
      setImporting(true);
      
      const content = await srtFile.text();
      const segments = parseSrtFile(content);
      
      if (segments.length === 0) {
        throw new Error("Nenhum segmento válido encontrado no arquivo SRT");
      }

      console.log('SRT segments parsed:', segments);

      await bulkImportSegments(segments);
      setSrtFile(null);
      setShowSrtImport(false);
      
      // Reset file input
      const fileInput = document.getElementById('srt-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Erro ao importar SRT:', error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Erro ao processar arquivo SRT",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const handleAddSegment = async () => {
    if (!newSegment.text.trim()) {
      toast({
        title: "Erro",
        description: "O texto da transcrição não pode estar vazio",
        variant: "destructive"
      });
      return;
    }

    const startSeconds = timeToSeconds(newSegment.start_time);
    const endSeconds = timeToSeconds(newSegment.end_time);

    if (startSeconds >= endSeconds) {
      toast({
        title: "Erro",
        description: "O tempo inicial deve ser menor que o tempo final",
        variant: "destructive"
      });
      return;
    }

    try {
      await saveSegment({
        start_time: startSeconds,
        end_time: endSeconds,
        text: newSegment.text
      });
      setNewSegment({ start_time: '', end_time: '', text: '' });
      setShowAddSegment(false);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleEditSegment = (segment: TranscriptionSegment) => {
    setEditingSegment(segment);
    setNewSegment({
      start_time: secondsToTime(segment.start_time),
      end_time: secondsToTime(segment.end_time),
      text: segment.text
    });
  };

  const handleUpdateSegment = async () => {
    if (!editingSegment) return;

    const startSeconds = timeToSeconds(newSegment.start_time);
    const endSeconds = timeToSeconds(newSegment.end_time);

    if (startSeconds >= endSeconds) {
      toast({
        title: "Erro",
        description: "O tempo inicial deve ser menor que o tempo final",
        variant: "destructive"
      });
      return;
    }

    try {
      await updateSegment(editingSegment.id, {
        start_time: startSeconds,
        end_time: endSeconds,
        text: newSegment.text
      });
      setEditingSegment(null);
      setNewSegment({ start_time: '', end_time: '', text: '' });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este segmento?')) {
      try {
        await deleteSegment(segmentId);
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const handleImportJson = async () => {
    if (!jsonText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o JSON com as transcrições",
        variant: "destructive"
      });
      return;
    }

    try {
      setImporting(true);
      const jsonData = JSON.parse(jsonText);
      
      // Validate JSON structure
      if (!Array.isArray(jsonData)) {
        throw new Error("O JSON deve ser uma lista de segmentos");
      }

      console.log('JSON data received:', jsonData);

      const validatedSegments = jsonData.map((item, index) => {
        console.log(`Processing segment ${index + 1}:`, item);
        
        let startTime, endTime;

        // Verificar se o tempo está em formato "HH:MM:SS" ou em segundos
        if (typeof item.start_time === 'string') {
          if (item.start_time.includes(':')) {
            startTime = timeToSeconds(item.start_time);
            console.log(`Converted start_time "${item.start_time}" to ${startTime} seconds`);
          } else {
            startTime = parseFloat(item.start_time);
          }
        } else if (typeof item.start_time === 'number') {
          startTime = item.start_time;
        } else {
          throw new Error(`Segmento ${index + 1}: formato de start_time inválido. Esperado string ou número, recebido: ${typeof item.start_time}`);
        }

        if (typeof item.end_time === 'string') {
          if (item.end_time.includes(':')) {
            endTime = timeToSeconds(item.end_time);
            console.log(`Converted end_time "${item.end_time}" to ${endTime} seconds`);
          } else {
            endTime = parseFloat(item.end_time);
          }
        } else if (typeof item.end_time === 'number') {
          endTime = item.end_time;
        } else {
          throw new Error(`Segmento ${index + 1}: formato de end_time inválido. Esperado string ou número, recebido: ${typeof item.end_time}`);
        }

        if (typeof item.text !== 'string' || !item.text.trim()) {
          throw new Error(`Segmento ${index + 1}: texto deve ser uma string não vazia`);
        }
        
        if (startTime >= endTime) {
          throw new Error(`Segmento ${index + 1}: tempo inicial (${startTime}s) deve ser menor que o tempo final (${endTime}s)`);
        }

        if (startTime < 0 || endTime < 0) {
          throw new Error(`Segmento ${index + 1}: tempos não podem ser negativos`);
        }

        return {
          start_time: startTime,
          end_time: endTime,
          text: item.text.trim()
        };
      });

      console.log('Validated segments:', validatedSegments);

      await bulkImportSegments(validatedSegments);
      setJsonText('');
      setShowJsonImport(false);
    } catch (error) {
      console.error('Erro ao importar JSON:', error);
      toast({
        title: "Erro na importação",
        description: error instanceof Error ? error.message : "Formato JSON inválido",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExportJson = () => {
    const exportData = segments.map(segment => ({
      start_time: secondsToTime(segment.start_time),
      end_time: secondsToTime(segment.end_time),
      text: segment.text
    }));

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcricao-${lessonTitle.replace(/[^a-zA-Z0-9]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída!",
      description: "Arquivo JSON foi baixado com sucesso"
    });
  };

  const handleClearAll = async () => {
    if (window.confirm('Tem certeza que deseja excluir TODAS as transcrições desta aula? Esta ação não pode ser desfeita.')) {
      try {
        await clearAllSegments();
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const formatTime = (seconds: number) => {
    return secondsToTime(seconds);
  };

  const getCurrentSegment = () => {
    return segments.find(seg => currentTime >= seg.start_time && currentTime <= seg.end_time);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Transcrição - {lessonTitle}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Legenda atual */}
          {getCurrentSegment() && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="text-sm text-blue-600 mb-1">
                  {formatTime(getCurrentSegment()!.start_time)} - {formatTime(getCurrentSegment()!.end_time)}
                </div>
                <div className="text-gray-900 font-medium">
                  {getCurrentSegment()!.text}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de ação */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Segmentos de Transcrição</h3>
            <div className="flex space-x-2">
              <Button onClick={() => setShowAddSegment(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Segmento
              </Button>
              <Button onClick={() => setShowSrtImport(true)} size="sm" variant="outline">
                <FileUp className="w-4 h-4 mr-2" />
                Importar SRT
              </Button>
              <Button onClick={() => setShowJsonImport(true)} size="sm" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Importar JSON
              </Button>
              {segments.length > 0 && (
                <>
                  <Button onClick={handleExportJson} size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar JSON
                  </Button>
                  <Button onClick={handleClearAll} size="sm" variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Limpar Tudo
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Formulário para adicionar/editar segmento */}
          {(showAddSegment || editingSegment) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {editingSegment ? 'Editar Segmento' : 'Novo Segmento'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_time">Tempo Inicial (HH:MM:SS)</Label>
                    <Input
                      id="start_time"
                      type="text"
                      value={newSegment.start_time}
                      onChange={(e) => setNewSegment({
                        ...newSegment,
                        start_time: e.target.value
                      })}
                      placeholder="Ex: 00:01:30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_time">Tempo Final (HH:MM:SS)</Label>
                    <Input
                      id="end_time"
                      type="text"
                      value={newSegment.end_time}
                      onChange={(e) => setNewSegment({
                        ...newSegment,
                        end_time: e.target.value
                      })}
                      placeholder="Ex: 00:01:45"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="text">Texto da Transcrição</Label>
                  <Textarea
                    id="text"
                    value={newSegment.text}
                    onChange={(e) => setNewSegment({
                      ...newSegment,
                      text: e.target.value
                    })}
                    placeholder="Digite o texto que corresponde a este período do áudio..."
                    rows={3}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={editingSegment ? handleUpdateSegment : handleAddSegment}>
                    {editingSegment ? 'Atualizar' : 'Adicionar'} Segmento
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowAddSegment(false);
                      setEditingSegment(null);
                      setNewSegment({ start_time: '', end_time: '', text: '' });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dialog para importação SRT */}
          <Dialog open={showSrtImport} onOpenChange={setShowSrtImport}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Importar Legenda SRT</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="srt-file-input">Arquivo SRT</Label>
                  <Input
                    id="srt-file-input"
                    type="file"
                    accept=".srt"
                    onChange={handleSrtFileSelect}
                    disabled={importing}
                  />
                </div>
                
                {srtFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <FileUp className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">{srtFile.name}</p>
                        <p className="text-sm text-green-600">
                          {(srtFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-sm text-gray-600">
                  <p><strong>Formato SRT esperado:</strong></p>
                  <pre className="bg-gray-100 p-3 rounded text-xs mt-2">
{`1
00:00:00,360 --> 00:00:03,360
Bem-vindas e bem-vindos ao nosso Deep Dive.

2
00:00:03,360 --> 00:00:04,000
Hoje o mergulho é nos direitos sociais.`}
                  </pre>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleImportSrt} disabled={importing || !srtFile}>
                    {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Importar SRT
                  </Button>
                  <Button variant="outline" onClick={() => setShowSrtImport(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dialog para importação JSON */}
          <Dialog open={showJsonImport} onOpenChange={setShowJsonImport}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Importar Transcrições via JSON</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="json-input">JSON das Transcrições</Label>
                  <Textarea
                    id="json-input"
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder={`Exemplo:
[
  {
    "start_time": "00:00:00",
    "end_time": "00:00:05",
    "text": "Olá, bem-vindos à nossa aula..."
  },
  {
    "start_time": "00:00:05",
    "end_time": "00:00:12",
    "text": "Hoje vamos estudar sobre..."
  }
]

Ou usando segundos:
[
  {
    "start_time": 0,
    "end_time": 5.2,
    "text": "Olá, bem-vindos à nossa aula..."
  }
]`}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Formatos aceitos:</strong></p>
                  <p>• Tempo: "HH:MM:SS" (ex: "00:01:30") ou segundos (ex: 90)</p>
                  <p>• Array de objetos com start_time, end_time e text</p>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleImportJson} disabled={importing}>
                    {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Importar Transcrições
                  </Button>
                  <Button variant="outline" onClick={() => setShowJsonImport(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Lista de segmentos */}
          <div className="space-y-2">
            {loading ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Loader2 className="w-8 h-8 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Carregando transcrições...</p>
                </CardContent>
              </Card>
            ) : segments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma transcrição adicionada ainda</p>
                  <p className="text-sm text-gray-500">Clique em "Adicionar Segmento", "Importar SRT" ou "Importar JSON" para começar</p>
                </CardContent>
              </Card>
            ) : (
              segments.map((segment) => (
                <Card key={segment.id} className={
                  currentTime >= segment.start_time && currentTime <= segment.end_time
                    ? "border-blue-500 bg-blue-50"
                    : ""
                }>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-1">
                          {formatTime(segment.start_time)} - {formatTime(segment.end_time)}
                        </div>
                        <div className="text-gray-900">
                          {segment.text}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditSegment(segment)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSegment(segment.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AudioTranscription;
