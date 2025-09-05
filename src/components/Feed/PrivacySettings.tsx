import { useState, useEffect } from 'react';
import { Shield, X } from 'lucide-react';

interface PrivacySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: PrivacySettingsData) => void;
  initialSettings: PrivacySettingsData;
}

interface PrivacySettingsData {
  profileVisibility: 'public' | 'friends' | 'private';
  connectionRequests: 'anyone' | 'friends_of_friends' | 'none';
  contactVisibility: 'everyone' | 'friends' | 'nobody';
  activityVisibility: 'public' | 'friends' | 'private';
}

export function PrivacySettings({ isOpen, onClose, onSave, initialSettings }: PrivacySettingsProps) {
  const [settings, setSettings] = useState<PrivacySettingsData>(initialSettings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(initialSettings);
    }
  }, [isOpen, initialSettings]);

  const handleChange = (field: keyof PrivacySettingsData, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(settings);
      onClose();
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
        w-full max-w-md bg-app-panel border border-app-border rounded-xl shadow-lg z-50
      `}>
        <div className="p-4 border-b border-app-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-app-text flex items-center gap-2">
              <Shield className="w-5 h-5 text-app-accent" />
              Configurações de Privacidade
            </h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-app-muted rounded-lg transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-app-text" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Profile Visibility */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-app-text-muted" />
              <h3 className="font-medium text-app-text">Visibilidade do Perfil</h3>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-app-border rounded-lg hover:bg-app-muted cursor-pointer">
                <input
                  type="radio"
                  name="profileVisibility"
                  value="public"
                  checked={settings.profileVisibility === 'public'}
                  onChange={() => handleChange('profileVisibility', 'public')}
                className="text-app-accent focus:ring-app-accent"
                />
                <div>
                  <div className="font-medium text-app-text">Público</div>
                  <div className="text-sm text-app-text-muted">Qualquer pessoa pode ver seu perfil</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-app-border rounded-lg hover:bg-app-muted cursor-pointer">
                <input
                  type="radio"
                  name="profileVisibility"
                  value="friends"
                  checked={settings.profileVisibility === 'friends'}
                  onChange={() => handleChange('profileVisibility', 'friends')}
                  className="text-app-accent focus:ring-app-accent"
                />
                <div>
                  <div className="font-medium text-app-text">Amigos</div>
                  <div className="text-sm text-app-text-muted">Apenas seus amigos podem ver seu perfil</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-app-border rounded-lg hover:bg-app-muted cursor-pointer">
                <input
                  type="radio"
                  name="profileVisibility"
                  value="private"
                  checked={settings.profileVisibility === 'private'}
                  onChange={() => handleChange('profileVisibility', 'private')}
                  className="text-app-accent focus:ring-app-accent"
                />
                <div>
                  <div className="font-medium text-app-text">Privado</div>
                  <div className="text-sm text-app-text-muted">Apenas você pode ver seu perfil</div>
                </div>
              </label>
            </div>
          </div>
          
          {/* Connection Requests */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-app-text-muted" />
              <h3 className="font-medium text-app-text">Solicitações de Conexão</h3>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-app-border rounded-lg hover:bg-app-muted cursor-pointer">
                <input
                  type="radio"
                  name="connectionRequests"
                  value="anyone"
                  checked={settings.connectionRequests === 'anyone'}
                  onChange={() => handleChange('connectionRequests', 'anyone')}
                  className="text-app-accent focus:ring-app-accent"
                />
                <div>
                  <div className="font-medium text-app-text">Qualquer pessoa</div>
                  <div className="text-sm text-app-text-muted">Qualquer pessoa pode enviar solicitações</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-app-border rounded-lg hover:bg-app-muted cursor-pointer">
                <input
                  type="radio"
                  name="connectionRequests"
                  value="friends_of_friends"
                  checked={settings.connectionRequests === 'friends_of_friends'}
                  onChange={() => handleChange('connectionRequests', 'friends_of_friends')}
                  className="text-app-accent focus:ring-app-accent"
                />
                <div>
                  <div className="font-medium text-app-text">Amigos de amigos</div>
                  <div className="text-sm text-app-text-muted">Apenas amigos de amigos podem enviar solicitações</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-app-border rounded-lg hover:bg-app-muted cursor-pointer">
                <input
                  type="radio"
                  name="connectionRequests"
                  value="none"
                  checked={settings.connectionRequests === 'none'}
                  onChange={() => handleChange('connectionRequests', 'none')}
                  className="text-app-accent focus:ring-app-accent"
                />
                <div>
                  <div className="font-medium text-app-text">Ninguém</div>
                  <div className="text-sm text-app-text-muted">Ninguém pode enviar solicitações</div>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-app-border flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-app-border rounded-lg text-app-text hover:bg-app-muted transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-app-accent text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center gap-2"
            disabled={saving}
          >
            {saving && <span className="animate-spin">⏳</span>}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
