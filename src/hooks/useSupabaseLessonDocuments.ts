
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface LessonDocument {
  id: string;
  lesson_id: string;
  title: string;
  file_name: string;
  file_path: string;
  document_type: string;
  created_at: string;
  updated_at: string;
}

export const useSupabaseLessonDocuments = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<LessonDocument[]>([]);
  const [loading, setLoading] = useState(false);

  // Função para sanitizar nome do arquivo
  const sanitizeFileName = (fileName: string): string => {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  // Função para migrar dados do localStorage para o Supabase
  const migrateLocalStorageData = async () => {
    if (!user) return;

    try {
      const localStorageKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('lesson_documents_')
      );

      for (const key of localStorageKeys) {
        const lessonId = key.replace('lesson_documents_', '');
        const localDocuments = JSON.parse(localStorage.getItem(key) || '[]');

        if (localDocuments.length > 0) {
          console.log(`Migrando ${localDocuments.length} documentos da aula ${lessonId}`);
          
          // Verificar se já existem documentos no Supabase para esta aula
          const { data: existingDocs } = await supabase
            .from('lesson_documents')
            .select('id')
            .eq('lesson_id', lessonId);

          // Se não há documentos no Supabase, migrar do localStorage
          if (!existingDocs || existingDocs.length === 0) {
            const documentsToInsert = localDocuments.map((doc: any) => ({
              user_id: user.id,
              lesson_id: lessonId,
              title: doc.title,
              file_name: doc.file_name,
              file_path: doc.file_path,
              document_type: doc.document_type || 'pdf',
              created_at: doc.created_at || new Date().toISOString()
            }));

            const { error } = await supabase
              .from('lesson_documents')
              .insert(documentsToInsert);

            if (error) {
              console.error(`Erro ao migrar documentos da aula ${lessonId}:`, error);
            } else {
              console.log(`Documentos da aula ${lessonId} migrados com sucesso`);
              localStorage.removeItem(key); // Remove do localStorage após migração
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro durante a migração dos documentos:', error);
    }
  };

  const uploadDocument = async (lessonId: string, file: File): Promise<LessonDocument | null> => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para fazer upload",
        variant: "destructive"
      });
      return null;
    }

    // Verificar se é PDF ou TXT
    const isValidType = file.type === 'application/pdf' || 
                       file.type === 'text/plain' || 
                       file.name.endsWith('.txt') || 
                       file.name.endsWith('.pdf');

    if (!isValidType) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Apenas arquivos PDF e TXT são aceitos",
        variant: "destructive"
      });
      return null;
    }

    try {
      setLoading(true);
      
      // Sanitizar o nome do arquivo
      const sanitizedFileName = sanitizeFileName(file.name);
      
      // Upload do arquivo para o storage
      const fileName = `${user.id}/lessons/${lessonId}/${Date.now()}_${sanitizedFileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Determinar tipo do documento
      const documentType = file.type === 'application/pdf' || file.name.endsWith('.pdf') ? 'pdf' : 'txt';

      // Salvar metadados no banco de dados
      const { data, error } = await supabase
        .from('lesson_documents')
        .insert({
          user_id: user.id,
          lesson_id: lessonId,
          title: file.name.replace(/\.(pdf|txt)$/i, ''),
          file_name: file.name,
          file_path: uploadData.path,
          document_type: documentType
        })
        .select()
        .single();

      if (error) throw error;

      const newDocument: LessonDocument = {
        id: data.id,
        lesson_id: data.lesson_id,
        title: data.title,
        file_name: data.file_name,
        file_path: data.file_path,
        document_type: data.document_type,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setDocuments(prev => [newDocument, ...prev]);

      toast({
        title: "Upload realizado com sucesso!",
        description: `${documentType.toUpperCase()} foi adicionado à aula`
      });

      return newDocument;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!user) return false;

    try {
      // Encontrar o documento
      const document = documents.find(doc => doc.id === documentId);
      if (!document) return false;

      // Remover do storage
      const { error: deleteError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (deleteError) {
        console.error('Delete error:', deleteError);
      }

      // Remover do banco de dados
      const { error } = await supabase
        .from('lesson_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      // Atualizar estado local
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));

      toast({
        title: "Documento removido",
        description: "O documento foi excluído com sucesso"
      });

      return true;
    } catch (error: any) {
      console.error('Erro ao excluir documento:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message || "Erro desconhecido",
        variant: "destructive"
      });
      return false;
    }
  };

  const carregarDocumentos = async (lessonId?: string) => {
    if (!user) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('lesson_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedDocuments: LessonDocument[] = (data || []).map(item => ({
        id: item.id,
        lesson_id: item.lesson_id,
        title: item.title,
        file_name: item.file_name,
        file_path: item.file_path,
        document_type: item.document_type,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setDocuments(formattedDocuments);
      
      if (lessonId) {
        console.log(`Carregados ${formattedDocuments.length} documentos para a aula ${lessonId}`);
      } else {
        console.log(`Carregados ${formattedDocuments.length} documentos no total`);
      }
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

  const getDocumentUrl = (filePath: string) => {
    const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // Executar migração e carregar documentos quando o usuário estiver logado
  useEffect(() => {
    if (user) {
      const runMigrationAndLoad = async () => {
        await migrateLocalStorageData();
        await carregarDocumentos();
      };
      runMigrationAndLoad();
    }
  }, [user]);

  return {
    documents,
    loading,
    uploadDocument,
    deleteDocument,
    carregarDocumentos,
    getDocumentUrl
  };
};
