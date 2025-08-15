import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface AnnotationCategory {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface AnnotationDocument {
  id: string;
  category_id: string;
  title: string;
  file_name: string;
  file_path: string;
  document_type: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface AnnotationQuestion {
  id: string;
  document_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
  created_at: string;
  updated_at: string;
}

interface QuestionAttempt {
  id: string;
  question_id: string;
  user_id: string;
  selected_answer: number;
  is_correct: boolean;
  completed_at: string;
}

export const useSupabaseAnnotations = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [categories, setCategories] = useState<AnnotationCategory[]>([]);
  const [documents, setDocuments] = useState<AnnotationDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarCategorias = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('annotation_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: "Erro ao carregar categorias",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const carregarDocumentos = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('annotation_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar documentos:', error);
      toast({
        title: "Erro ao carregar documentos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const criarCategoria = async (nome: string): Promise<AnnotationCategory | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('annotation_categories')
        .insert([{
          name: nome,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      setCategories(prev => [data, ...prev]);
      return data;
    } catch (error: any) {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const sanitizeFileName = (fileName: string): string => {
    // Remove ou substitui caracteres que não são permitidos no Supabase Storage
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres especiais por underscore
      .replace(/_{2,}/g, '_') // Remove underscores duplicados
      .replace(/^_|_$/g, ''); // Remove underscores no início e fim
  };

  const uploadDocument = async (
    categoryId: string,
    title: string,
    file: File
  ): Promise<AnnotationDocument | null> => {
    if (!user) return null;

    try {
      // Sanitizar o nome do arquivo para remover caracteres inválidos
      const sanitizedFileName = sanitizeFileName(file.name);
      const fileName = `${Date.now()}-${sanitizedFileName}`;
      const filePath = `${user.id}/${fileName}`;

      console.log('Uploading file with path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from('annotation_documents')
        .insert([{
          category_id: categoryId,
          title,
          file_name: fileName,
          file_path: filePath,
          document_type: 'pdf',
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setDocuments(prev => [data, ...prev]);
      
      toast({
        title: "Documento salvo!",
        description: "Documento foi carregado com sucesso"
      });

      return data;
    } catch (error: any) {
      console.error('Erro ao fazer upload do documento:', error);
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const deletarDocumento = async (documentId: string, filePath: string) => {
    try {
      // Deletar arquivo do storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Deletar registro do banco
      const { error } = await supabase
        .from('annotation_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      toast({
        title: "Documento excluído",
        description: "Documento foi removido com sucesso"
      });
    } catch (error: any) {
      console.error('Erro ao deletar documento:', error);
      toast({
        title: "Erro ao excluir documento",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const obterUrlDocumento = (filePath: string): string => {
    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  };

  const carregarQuestoes = async (documentId: string): Promise<AnnotationQuestion[]> => {
    try {
      const { data, error } = await supabase
        .from('annotation_questions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Convert Json type to string[] for options
      const questionsWithParsedOptions = (data || []).map(question => ({
        ...question,
        options: Array.isArray(question.options) ? question.options as string[] : []
      }));
      
      return questionsWithParsedOptions;
    } catch (error: any) {
      console.error('Erro ao carregar questões:', error);
      return [];
    }
  };

  const criarQuestao = async (
    documentId: string,
    question: string,
    options: string[],
    correctAnswer: number,
    explanation?: string
  ): Promise<AnnotationQuestion | null> => {
    try {
      const { data, error } = await supabase
        .from('annotation_questions')
        .insert([{
          document_id: documentId,
          question,
          options,
          correct_answer: correctAnswer,
          explanation
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Convert Json type to string[] for options
      const questionWithParsedOptions = {
        ...data,
        options: Array.isArray(data.options) ? data.options as string[] : []
      };
      
      return questionWithParsedOptions;
    } catch (error: any) {
      console.error('Erro ao criar questão:', error);
      toast({
        title: "Erro ao criar questão",
        description: error.message,
        variant: "destructive"
      });
      return null;
    }
  };

  const registrarTentativa = async (
    questionId: string,
    selectedAnswer: number,
    isCorrect: boolean
  ): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('question_attempts')
        .insert([{
          question_id: questionId,
          user_id: user.id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect
        }]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao registrar tentativa:', error);
    }
  };

  const carregarTentativas = async (questionId: string): Promise<QuestionAttempt[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('question_attempts')
        .select('*')
        .eq('question_id', questionId)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Erro ao carregar tentativas:', error);
      return [];
    }
  };

  useEffect(() => {
    if (user) {
      carregarCategorias();
      carregarDocumentos();
    }
  }, [user]);

  return {
    categories,
    documents,
    loading,
    criarCategoria,
    uploadDocument,
    deletarDocumento,
    obterUrlDocumento,
    carregarQuestoes,
    criarQuestao,
    registrarTentativa,
    carregarTentativas,
    recarregar: () => {
      carregarCategorias();
      carregarDocumentos();
    }
  };
};
