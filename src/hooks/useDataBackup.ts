
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface BackupData {
  timestamp: string;
  version: string;
  data: {
    cnuStudyStats: any;
    cnuBancoQuestoes: any;
    cnuFlashcards: any;
    cnuResumos: any;
    cnuVideos: any;
    cnuPlanoEstudos: any;
    cnuHistoricoTentativas: any;
    timerState: any;
  };
}

export const useDataBackup = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const createBackup = (): BackupData => {
    const data: BackupData['data'] = {
      cnuStudyStats: JSON.parse(localStorage.getItem('cnuStudyStats') || '{}'),
      cnuBancoQuestoes: JSON.parse(localStorage.getItem('cnuBancoQuestoes') || '[]'),
      cnuFlashcards: JSON.parse(localStorage.getItem('cnuFlashcards') || '[]'),
      cnuResumos: JSON.parse(localStorage.getItem('cnuResumos') || '[]'),
      cnuVideos: JSON.parse(localStorage.getItem('cnuVideos') || '[]'),
      cnuPlanoEstudos: JSON.parse(localStorage.getItem('cnuPlanoEstudos') || '{}'),
      cnuHistoricoTentativas: JSON.parse(localStorage.getItem('cnuHistoricoTentativas') || '[]'),
      timerState: JSON.parse(localStorage.getItem('timerState') || '{}')
    };

    return {
      timestamp: new Date().toISOString(),
      version: '1.0',
      data
    };
  };

  const exportBackup = () => {
    try {
      const backup = createBackup();
      const dataStr = JSON.stringify(backup, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cnu-backup-${backup.timestamp.split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup exportado!",
        description: "Seus dados foram exportados com sucesso."
      });
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      toast({
        title: "Erro no backup",
        description: "Não foi possível exportar os dados.",
        variant: "destructive"
      });
    }
  };

  const importBackup = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const backup: BackupData = JSON.parse(result);
        
        if (!backup.data || !backup.timestamp) {
          throw new Error('Formato de backup inválido');
        }

        // Restaurar dados
        Object.entries(backup.data).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            localStorage.setItem(key, JSON.stringify(value));
          }
        });

        toast({
          title: "Backup restaurado!",
          description: `Dados de ${new Date(backup.timestamp).toLocaleDateString()} foram restaurados.`
        });

        // Recarregar a página para aplicar os dados
        setTimeout(() => {
          window.location.reload();
        }, 1000);

      } catch (error) {
        console.error('Erro ao importar backup:', error);
        toast({
          title: "Erro na importação",
          description: "Arquivo de backup inválido ou corrompido.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    reader.readAsText(file);
  };

  const autoBackup = () => {
    try {
      const backup = createBackup();
      const backups = JSON.parse(localStorage.getItem('cnuAutoBackups') || '[]');
      
      // Manter apenas os últimos 5 backups automáticos
      backups.push(backup);
      if (backups.length > 5) {
        backups.shift();
      }
      
      localStorage.setItem('cnuAutoBackups', JSON.stringify(backups));
      console.log('Auto backup criado:', backup.timestamp);
    } catch (error) {
      console.error('Erro no auto backup:', error);
    }
  };

  const getAutoBackups = (): BackupData[] => {
    try {
      return JSON.parse(localStorage.getItem('cnuAutoBackups') || '[]');
    } catch {
      return [];
    }
  };

  const restoreAutoBackup = (backup: BackupData) => {
    try {
      Object.entries(backup.data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });

      toast({
        title: "Backup restaurado!",
        description: `Dados de ${new Date(backup.timestamp).toLocaleDateString()} foram restaurados.`
      });

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Erro ao restaurar auto backup:', error);
      toast({
        title: "Erro na restauração",
        description: "Não foi possível restaurar o backup.",
        variant: "destructive"
      });
    }
  };

  // Auto backup a cada 30 minutos
  useEffect(() => {
    const interval = setInterval(autoBackup, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    exportBackup,
    importBackup,
    autoBackup,
    getAutoBackups,
    restoreAutoBackup,
    isLoading
  };
};
