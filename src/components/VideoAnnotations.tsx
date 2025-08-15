
import { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AnnotationForm from './video-annotations/AnnotationForm';
import AnnotationList from './video-annotations/AnnotationList';

interface Annotation {
  id: string;
  timestamp: number;
  content: string;
  createdAt: string;
}

interface VideoAnnotationsProps {
  videoId: string;
  videoTitle: string;
  currentTime: number;
  isOpen: boolean;
  onClose: () => void;
}

const VideoAnnotations = ({ videoId, videoTitle, currentTime, isOpen, onClose }: VideoAnnotationsProps) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [newAnnotation, setNewAnnotation] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAnnotations();
    }
  }, [isOpen, videoId]);

  const loadAnnotations = () => {
    const saved = localStorage.getItem(`video-annotations-${videoId}`);
    if (saved) {
      setAnnotations(JSON.parse(saved));
    }
  };

  const saveAnnotations = (updatedAnnotations: Annotation[]) => {
    localStorage.setItem(`video-annotations-${videoId}`, JSON.stringify(updatedAnnotations));
    setAnnotations(updatedAnnotations);
  };

  const addAnnotation = () => {
    if (!newAnnotation.trim()) return;

    const annotation: Annotation = {
      id: Date.now().toString(),
      timestamp: Math.floor(currentTime),
      content: newAnnotation.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = [...annotations, annotation].sort((a, b) => a.timestamp - b.timestamp);
    saveAnnotations(updated);
    setNewAnnotation('');
  };

  const deleteAnnotation = (id: string) => {
    const updated = annotations.filter(ann => ann.id !== id);
    saveAnnotations(updated);
  };

  const updateAnnotation = (id: string, content: string) => {
    const updated = annotations.map(ann => 
      ann.id === id 
        ? { ...ann, content }
        : ann
    );
    saveAnnotations(updated);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Anotações - {videoTitle}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          <AnnotationForm
            newAnnotation={newAnnotation}
            setNewAnnotation={setNewAnnotation}
            currentTime={currentTime}
            onAddAnnotation={addAnnotation}
          />

          <AnnotationList
            annotations={annotations}
            onDeleteAnnotation={deleteAnnotation}
            onUpdateAnnotation={updateAnnotation}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoAnnotations;
