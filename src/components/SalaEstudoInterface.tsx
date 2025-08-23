import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Library, 
  Link2, 
  Send, 
  Moon, 
  Sun, 
  Users, 
  UserPlus, 
  MessageSquare, 
  Activity, 
  RefreshCcw, 
  LogOut, 
  Check,
  CheckCircle,
  GraduationCap,
  BookOpen,
  ArrowLeft,
  Users2,
  X,
  Plus,
  Search,
  Globe,
  Lock,
  Star,
  Pencil,
  LogIn,
  Save,
  RotateCcw,
  Paperclip,
  Layers,
  Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Types
type Room = {
  id: string;
  nome: string;
  descricao: string;
  vis: 'public' | 'private';
  members: number;
  max?: number;
  allowed?: string[];
  favorite?: boolean;
  host?: string;
  invited?: boolean;
};

type Friend = {
  id: string;
  nome: string;
};

export function SalaEstudoInterface() {
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Salas modal state
  const [salasModalOpen, setSalasModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'minhas' | 'amigos'>('minhas');
  const [searchMinhas, setSearchMinhas] = useState('');
  const [searchAmigos, setSearchAmigos] = useState('');
  const [favoritesFirst, setFavoritesFirst] = useState(true);
  
  // Room creation/edit state
  const [roomSheetOpen, setRoomSheetOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({
    nome: '',
    descricao: '',
    visibilidade: 'public' as 'public' | 'private',
    max: '',
    allowed: [] as string[],
    convidados: [] as string[]
  });

  // Mock data
  const friends: Friend[] = [
    { id: 'u1', nome: 'Paulo' },
    { id: 'u2', nome: 'Júlia' },
    { id: 'u3', nome: 'Alex' },
    { id: 'u4', nome: 'Beatriz' },
  ];

  const [minhasSalas, setMinhasSalas] = useState<Room[]>([
    { 
      id: 'r1', 
      nome: 'ENEM 2025 — Redação', 
      descricao: 'Prática semanal de redação com correções.', 
      vis: 'public', 
      members: 23, 
      max: 50, 
      allowed: ['chat', 'arquivos', 'cards'], 
      favorite: true, 
      host: 'Você' 
    },
    { 
      id: 'r2', 
      nome: 'Cálculo I', 
      descricao: 'Listas e monitoria às quartas.', 
      vis: 'private', 
      members: 8, 
      max: 12, 
      allowed: ['chat', 'voz'], 
      favorite: false, 
      host: 'Você' 
    },
  ]);

  const [salasAmigos, setSalasAmigos] = useState<Room[]>([
    { 
      id: 'r3', 
      nome: 'História do Brasil', 
      descricao: 'Revolução Farroupilha e Cabanagem.', 
      vis: 'public', 
      members: 14, 
      host: 'Júlia' 
    },
    { 
      id: 'r4', 
      nome: 'Álgebra Linear', 
      descricao: 'Exercícios de matrizes e vetores.', 
      vis: 'private', 
      members: 6, 
      max: 10, 
      host: 'Alex', 
      invited: false 
    },
    { 
      id: 'r5', 
      nome: 'Português — Gramática', 
      descricao: 'Concordância e crase.', 
      vis: 'public', 
      members: 31, 
      host: 'Paulo' 
    },
  ]);

  useEffect(() => {
    // Aplicar tema escuro ao componente
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      alert('Não foi possível copiar o link.');
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handleBack = () => {
    navigate(-1); // Volta para a página anterior
  };

  // Helper functions
  const sortRooms = (rooms: Room[]) => {
    return rooms.slice().sort((a, b) => {
      if (!favoritesFirst) return a.nome.localeCompare(b.nome);
      const fa = a.favorite ? 1 : 0;
      const fb = b.favorite ? 1 : 0;
      if (fa !== fb) return fb - fa; // favoritos primeiro
      return a.nome.localeCompare(b.nome);
    });
  };

  const filterRooms = (rooms: Room[], search: string) => {
    return rooms.filter(room => 
      room.nome.toLowerCase().includes(search.toLowerCase())
    );
  };

  const getVisibilityIcon = (vis: string) => {
    return vis === 'public' ? Globe : Lock;
  };

  const getAllowedIcon = (type: string) => {
    switch (type) {
      case 'chat': return MessageSquare;
      case 'arquivos': return Paperclip;
      case 'cards': return Layers;
      case 'voz': return Mic;
      default: return MessageSquare;
    }
  };

  // Event handlers
  const handleOpenSalas = () => {
    setSalasModalOpen(true);
  };

  const handleCloseSalas = () => {
    setSalasModalOpen(false);
  };

  const handleTabChange = (tab: 'minhas' | 'amigos') => {
    setActiveTab(tab);
  };

  const handleToggleFavorite = (roomId: string, context: 'minhas' | 'amigos') => {
    if (context === 'minhas') {
      setMinhasSalas(prev => prev.map(room => 
        room.id === roomId ? { ...room, favorite: !room.favorite } : room
      ));
    }
  };

  const handleCreateRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      nome: '',
      descricao: '',
      visibilidade: 'public',
      max: '',
      allowed: [],
      convidados: []
    });
    setRoomSheetOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomForm({
      nome: room.nome,
      descricao: room.descricao,
      visibilidade: room.vis,
      max: room.max?.toString() || '',
      allowed: room.allowed || [],
      convidados: []
    });
    setRoomSheetOpen(true);
  };

  const handleSaveRoom = () => {
    if (!roomForm.nome.trim() || !roomForm.descricao.trim()) {
      alert('Preencha Nome e Descrição.');
      return;
    }

    const roomData = {
      nome: roomForm.nome.trim(),
      descricao: roomForm.descricao.trim(),
      vis: roomForm.visibilidade,
      max: roomForm.max ? Number(roomForm.max) : undefined,
      allowed: roomForm.allowed,
    };

    if (editingRoom) {
      // Edit existing room
      setMinhasSalas(prev => prev.map(room => 
        room.id === editingRoom.id ? { ...room, ...roomData } : room
      ));
    } else {
      // Create new room
      const newRoom: Room = {
        id: `r${Date.now()}`,
        ...roomData,
        members: 1,
        favorite: false,
        host: 'Você'
      };
      setMinhasSalas(prev => [...prev, newRoom]);
    }

    setRoomSheetOpen(false);
  };

  const handleEnterRoom = (room: Room, context: 'minhas' | 'amigos') => {
    if (context === 'amigos') {
      if (room.vis === 'public' || room.invited) {
        // Mock joining room - move to my rooms
        const existingRoom = minhasSalas.find(r => r.id === room.id);
        if (!existingRoom) {
          setMinhasSalas(prev => [...prev, { ...room }]);
        }
        setActiveTab('minhas');
      }
    } else {
      // Open room (mock)
      alert('Abrir sala (mock)');
    }
  };

  const handleUpdateFriendRooms = () => {
    // Mock adding a new room
    const newRoom: Room = {
      id: `r${Math.floor(Math.random() * 9999)}`,
      nome: 'Sala pública nova',
      descricao: 'Conteúdos diversos.',
      vis: 'public',
      members: Math.floor(Math.random() * 20) + 1,
      host: 'Beatriz'
    };
    setSalasAmigos(prev => [newRoom, ...prev]);
  };

  return (
    <div className="sala-estudo-wrapper">
      <style>{`
        .sala-estudo-wrapper {
          --bg: hsl(var(--app-bg));
          --bg-soft: hsl(var(--app-bg-soft));
          --panel: hsl(var(--app-panel));
          --muted: hsl(var(--app-muted));
          --border: hsl(var(--app-border));
          --text: hsl(var(--app-text));
          --text-muted: hsl(var(--app-text-muted));
          --accent: hsl(var(--app-accent));
          --accent-2: hsl(var(--app-accent-2));
          --ok: hsl(var(--app-success));
          --warn: hsl(var(--app-warning));
          --danger: hsl(var(--app-danger));
          --shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          --radius: 14px;
          min-height: 100vh;
          background: var(--bg);
          color: var(--text);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }

        [data-theme="dark"] .sala-estudo-wrapper {
          --shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        }

        .sala-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--panel);
          border-bottom: 1px solid var(--border);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sala-content {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr) 360px;
          gap: 14px;
          padding: 14px;
          align-items: stretch;
        }

        @media (max-width: 1100px) {
          .sala-content {
            grid-template-columns: 240px minmax(0, 1fr) 320px;
          }
        }

        @media (max-width: 900px) {
          .sala-content {
            grid-template-columns: minmax(0, 1fr);
            padding: 10px;
          }
        }

        .sala-panel {
          background: var(--bg-soft);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: var(--shadow);
          display: flex;
          flex-direction: column;
          min-height: calc(100vh - 56px - 28px);
        }

        .panel-head {
          padding: 12px 12px 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid var(--border);
        }

        .panel-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 0;
          overflow: auto;
        }

        .members-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .member {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: color-mix(in oklab, var(--bg) 60%, var(--panel));
        }

        .avatar {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 12px;
          font-weight: 600;
          background: color-mix(in oklab, var(--accent) 12%, var(--muted));
          color: var(--text);
        }

        .status {
          width: 10px;
          height: 10px;
          border-radius: 999px;
        }

        .online { background: var(--ok); }
        .offline { background: var(--text-muted); }

        .chat {
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .chat-log {
          flex: 1;
          overflow: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: var(--bg-soft);
        }

        .msg {
          max-width: 70%;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--muted);
        }

        .msg .meta {
          margin-top: 6px;
          font-size: 11px;
          color: var(--text-muted);
        }

        .me {
          align-self: flex-end;
          background: linear-gradient(90deg, var(--accent), var(--accent-2));
          color: #fff;
          border-color: transparent;
        }

        .me .meta {
          color: rgba(255, 255, 255, 0.85);
        }

        .composer {
          border-top: 1px solid var(--border);
          padding: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--panel);
        }

        .activity {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: color-mix(in oklab, var(--bg) 60%, var(--panel));
        }

        .activity .time {
          font-size: 11px;
          color: var(--text-muted);
        }

        .sala-input {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 8px 10px;
          border-radius: 10px;
          outline: none;
          flex: 1;
        }

        .sala-input::placeholder {
          color: var(--text-muted);
        }

        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 12px;
          border: 1px solid var(--border);
          background: var(--bg);
        }

        .btn-sala {
          border: 1px solid transparent;
          background: color-mix(in oklab, var(--bg) 60%, var(--panel));
          color: var(--text);
          padding: 8px 10px;
          border-radius: 10px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          font-size: 14px;
        }

        .btn-sala:hover {
          filter: brightness(1.04);
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--border);
        }

        .btn-primary {
          background: linear-gradient(90deg, var(--accent), var(--accent-2));
          color: #fff;
          font-weight: 600;
        }

        .btn-ghost {
          background: transparent;
          border-color: transparent;
        }

        .btn-icon {
          width: 36px;
          height: 36px;
          justify-content: center;
          padding: 0;
        }

        .grow { flex: 1; }
        .text-lg { font-size: 18px; }
        .text-xl { font-size: 20px; font-weight: 600; }
        .text-sm { font-size: 12px; }
        .text-xs { font-size: 11px; }
        .bold { font-weight: 600; }
        .muted { color: var(--text-muted); }

        /* Salas Modal Styles */
        .salas-overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.48);
          display: ${salasModalOpen ? 'flex' : 'none'};
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 50;
        }

        .salas-modal {
          width: min(1040px, 96vw);
          max-height: 90vh;
          display: grid;
          grid-template-rows: auto 1fr auto;
          overflow: hidden;
          background: var(--bg-soft);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: var(--shadow);
        }

        .modal-head {
          padding: 12px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .modal-body {
          padding: 12px;
          overflow: auto;
        }

        .modal-foot {
          padding: 12px;
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tabs {
          display: inline-flex;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 4px;
        }

        .tab {
          padding: 6px 10px;
          border-radius: 999px;
          cursor: pointer;
          border: 1px solid transparent;
          font-size: 12px;
          background: transparent;
          color: var(--text);
        }

        .tab.active {
          background: var(--panel);
          border-color: var(--border);
          box-shadow: var(--shadow);
        }

        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .room-card {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: color-mix(in oklab, var(--bg) 60%, var(--panel));
        }

        .room-header {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .room-title {
          font-weight: 600;
          margin: 0;
        }

        .room-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .room-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .search-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        /* Room Creation Sheet */
        .room-sheet {
          position: fixed;
          right: 16px;
          bottom: 16px;
          width: min(480px, 96vw);
          max-height: 80vh;
          overflow: hidden;
          display: ${roomSheetOpen ? 'block' : 'none'};
          z-index: 60;
          background: var(--bg-soft);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: var(--shadow);
        }

        .sheet-panel {
          display: grid;
          grid-template-rows: auto 1fr auto;
          overflow: hidden;
          max-height: 80vh;
        }

        .sheet-body {
          padding: 12px;
          overflow: auto;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-grid.full {
          grid-template-columns: 1fr;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 12px;
          font-weight: 600;
        }

        .form-input, .form-select, .form-textarea {
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 8px 10px;
          border-radius: 10px;
          outline: none;
        }

        .form-textarea {
          min-height: 90px;
          resize: vertical;
          padding: 10px 12px;
          border-radius: 12px;
        }

        .divider {
          height: 1px;
          background: var(--border);
          margin: 12px 0;
        }

        .checkbox-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .checkbox-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 12px;
          border: 1px solid var(--border);
          background: var(--bg);
          cursor: pointer;
        }

        @media (max-width: 900px) {
          .members { order: 2; }
          .feed { order: 3; }
          .chat-wrap { order: 1; }
          .sala-panel { min-height: auto; }
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="sala-header">
        <Button
          onClick={handleBack}
          variant="ghost"
          size="sm"
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Library className="h-5 w-5" />
        <div className="text-xl">Sala de Estudo</div>
        <div className="chip">#A1</div>
        <div className="grow"></div>
        <button
          className="btn-sala btn-outline"
          onClick={handleCopyLink}
          title="Copiar link da sala"
        >
          {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
          {copied ? 'Copiado!' : 'Copiar link'}
        </button>
        <button className="btn-sala btn-outline" title="Convidar">
          <Send className="h-4 w-4" />
          Convidar
        </button>
        <button className="btn-sala btn-primary" onClick={toggleTheme} title="Alternar tema">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          <span className="text-sm">Tema</span>
        </button>
        <button className="btn-sala btn-outline" onClick={handleOpenSalas} title="Abrir salas">
          <Users2 className="h-4 w-4" />
          <span className="text-sm">Salas</span>
        </button>
      </div>

      <main className="sala-content">
        {/* Membros */}
        <section className="sala-panel members">
          <div className="panel-head">
            <Users className="h-5 w-5" />
            <h2 className="text-lg bold" style={{ margin: 0 }}>Membros</h2>
            <div className="grow"></div>
            <span className="text-sm muted">4</span>
          </div>
          <div className="panel-body">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                className="sala-input"
                placeholder="Buscar membro"
                aria-label="Buscar membro"
              />
              <button className="btn-sala btn-outline" title="Adicionar">
                <UserPlus className="h-4 w-4" />
              </button>
            </div>
            <div className="members-list">
              <div className="member">
                <div className="avatar">PA</div>
                <div className="grow">
                  <div className="bold">
                    Paulo Andrade <span className="chip">host</span>
                  </div>
                  <div className="text-xs muted">Foco em Português</div>
                </div>
                <span className="status online" title="online"></span>
              </div>
              <div className="member">
                <div className="avatar">JU</div>
                <div className="grow">
                  <div className="bold">Júlia Ribeiro</div>
                  <div className="text-xs muted">História • 30 min</div>
                </div>
                <span className="status online" title="online"></span>
              </div>
              <div className="member">
                <div className="avatar">AL</div>
                <div className="grow">
                  <div className="bold">Alex Souza</div>
                  <div className="text-xs muted">Álgebra</div>
                </div>
                <span className="status offline" title="offline"></span>
              </div>
              <div className="member">
                <div className="avatar">BE</div>
                <div className="grow">
                  <div className="bold">Beatriz Lima</div>
                  <div className="text-xs muted">Revisão ENEM</div>
                </div>
                <span className="status online" title="online"></span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
              <button className="btn-sala btn-outline grow">
                <Users className="h-4 w-4" />
                Convidar amigos
              </button>
              <button className="btn-sala btn-ghost" title="Sair da sala">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Chat */}
        <section className="sala-panel chat-wrap">
          <div className="panel-head">
            <MessageSquare className="h-5 w-5" />
            <h2 className="text-lg bold" style={{ margin: 0 }}>Chat</h2>
            <div className="grow"></div>
            <span className="text-sm muted">tempo real (mock)</span>
          </div>
          <div className="chat grow">
            <div className="chat-log">
              <div className="msg">
                <div className="bold">Júlia</div>
                Comecei a assistir à aula de Revolução Francesa.
                <div className="meta">há 2 min</div>
              </div>
              <div className="msg me">
                Boa! Depois faço os exercícios de adjetivos.
                <div className="meta">você • há 1 min</div>
              </div>
              <div className="msg">
                <div className="bold">Paulo</div>
                Fiz o exercício vinculado à aula "Adjetivos" e acertei.
                <div className="meta">agora mesmo</div>
              </div>
            </div>
            <div className="composer">
              <input
                className="sala-input"
                placeholder="Escreva uma mensagem… (mock)"
                aria-label="Mensagem"
              />
              <button className="btn-sala btn-primary" title="Enviar">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Feed de atividades */}
        <aside className="sala-panel feed">
          <div className="panel-head">
            <Activity className="h-5 w-5" />
            <h2 className="text-lg bold" style={{ margin: 0 }}>Feed de atividades</h2>
            <div className="grow"></div>
            <button className="btn-sala btn-ghost btn-icon" title="Atualizar">
              <RefreshCcw className="h-4 w-4" />
            </button>
          </div>
          <div className="panel-body activity">
            <div className="activity-item">
              <CheckCircle className="h-5 w-5" />
              <div className="grow">
                <div>
                  Paulo fez o exercício vinculado à aula <b>"Adjetivos"</b> e acertou.
                </div>
                <div className="time">agora mesmo</div>
              </div>
            </div>
            <div className="activity-item">
              <GraduationCap className="h-5 w-5" />
              <div className="grow">
                <div>
                  Júlia assistiu à aula de <b>Revolução Francesa</b> de 30 minutos.
                </div>
                <div className="time">há 3 min</div>
              </div>
            </div>
            <div className="activity-item">
              <BookOpen className="h-5 w-5" />
              <div className="grow">
                <div>Alex revisou 20 flashcards de Álgebra.</div>
                <div className="time">há 12 min</div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Salas Modal */}
      {salasModalOpen && (
        <div className="salas-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseSalas();
        }}>
          <div className="salas-modal">
            <div className="modal-head">
              <Users2 className="h-5 w-5" />
              <div className="text-lg bold">Salas</div>
              <div className="grow"></div>
              <div className="tabs">
                <button 
                  className={`tab ${activeTab === 'minhas' ? 'active' : ''}`}
                  onClick={() => handleTabChange('minhas')}
                >
                  Minhas salas
                </button>
                <button 
                  className={`tab ${activeTab === 'amigos' ? 'active' : ''}`}
                  onClick={() => handleTabChange('amigos')}
                >
                  Amigos
                </button>
              </div>
              <button 
                className="btn-sala btn-ghost btn-icon" 
                onClick={handleCloseSalas}
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="modal-body">
              {activeTab === 'minhas' && (
                <div>
                  <div className="search-row">
                    <input
                      className="form-input grow"
                      placeholder="Buscar sala"
                      value={searchMinhas}
                      onChange={(e) => setSearchMinhas(e.target.value)}
                    />
                    <button 
                      className="btn-sala btn-primary" 
                      onClick={handleCreateRoom}
                    >
                      <Plus className="h-4 w-4" />
                      Criar nova sala
                    </button>
                  </div>
                  <div className="rooms-grid">
                    {sortRooms(filterRooms(minhasSalas, searchMinhas)).map(room => {
                      const VisIcon = getVisibilityIcon(room.vis);
                      return (
                        <div key={room.id} className="room-card">
                          <div className="room-header">
                            <div className="grow">
                              <div className="room-title">{room.nome}</div>
                              <div className="muted text-sm">{room.descricao}</div>
                            </div>
                            <button
                              className="btn-sala btn-ghost btn-icon"
                              onClick={() => handleToggleFavorite(room.id, 'minhas')}
                              title="Favoritar"
                            >
                              <Star 
                                className="h-4 w-4" 
                                style={room.favorite ? { fill: 'currentColor' } : {}}
                              />
                            </button>
                          </div>
                          <div className="room-meta">
                            <span className="chip">
                              <VisIcon className="h-4 w-4" />
                              {room.vis === 'public' ? 'Pública' : 'Privada'}
                            </span>
                            <span className="chip">
                              <Users className="h-4 w-4" />
                              {room.members}{room.max ? `/${room.max}` : ''}
                            </span>
                            {room.allowed?.map(type => {
                              const AllowedIcon = getAllowedIcon(type);
                              return (
                                <span key={type} className="chip">
                                  <AllowedIcon className="h-4 w-4" />
                                  {type}
                                </span>
                              );
                            })}
                          </div>
                          <div className="room-actions">
                            <button 
                              className="btn-sala btn-outline"
                              onClick={() => handleEditRoom(room)}
                            >
                              <Pencil className="h-4 w-4" />
                              Editar
                            </button>
                            <button 
                              className="btn-sala btn-primary"
                              onClick={() => handleEnterRoom(room, 'minhas')}
                            >
                              <LogIn className="h-4 w-4" />
                              Entrar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'amigos' && (
                <div>
                  <div className="search-row">
                    <input
                      className="form-input grow"
                      placeholder="Buscar sala de amigos"
                      value={searchAmigos}
                      onChange={(e) => setSearchAmigos(e.target.value)}
                    />
                    <button 
                      className="btn-sala btn-outline"
                      onClick={handleUpdateFriendRooms}
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Atualizar
                    </button>
                  </div>
                  <div className="rooms-grid">
                    {filterRooms(salasAmigos, searchAmigos).map(room => {
                      const VisIcon = getVisibilityIcon(room.vis);
                      const canEnter = room.vis === 'public' || room.invited;
                      return (
                        <div key={room.id} className="room-card">
                          <div className="room-header">
                            <div className="grow">
                              <div className="room-title">{room.nome}</div>
                              <div className="muted text-sm">{room.descricao}</div>
                            </div>
                            <button
                              className="btn-sala btn-ghost btn-icon"
                              onClick={() => handleToggleFavorite(room.id, 'amigos')}
                              title="Favoritar"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="room-meta">
                            <span className="chip">
                              <VisIcon className="h-4 w-4" />
                              {room.vis === 'public' ? 'Pública' : 'Privada'}
                            </span>
                            <span className="chip">
                              <Users className="h-4 w-4" />
                              {room.members}{room.max ? `/${room.max}` : ''}
                            </span>
                          </div>
                          <div className="room-actions">
                            {canEnter ? (
                              <button 
                                className="btn-sala btn-primary"
                                onClick={() => handleEnterRoom(room, 'amigos')}
                              >
                                <LogIn className="h-4 w-4" />
                                Entrar
                              </button>
                            ) : (
                              <button className="btn-sala btn-outline" disabled>
                                <Lock className="h-4 w-4" />
                                Solicitar convite
                              </button>
                            )}
                            <span className="muted text-sm">host: {room.host || '-'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-foot">
              <div className="muted text-sm">
                Salas públicas podem ser acessadas por qualquer usuário. Salas privadas exigem convite.
              </div>
              <div className="grow"></div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  checked={favoritesFirst}
                  onChange={(e) => setFavoritesFirst(e.target.checked)}
                />
                <span className="text-sm muted">Favoritas no topo</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Room Creation/Edit Sheet */}
      {roomSheetOpen && (
        <div className="room-sheet">
          <div className="sheet-panel">
            <div className="modal-head">
              <Plus className="h-5 w-5" />
              <div className="text-lg bold">
                {editingRoom ? 'Editar sala' : 'Criar nova sala'}
              </div>
              <div className="grow"></div>
              <button 
                className="btn-sala btn-ghost btn-icon"
                onClick={() => setRoomSheetOpen(false)}
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="sheet-body">
              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Nome da sala *</label>
                  <input
                    className="form-input"
                    value={roomForm.nome}
                    onChange={(e) => setRoomForm({...roomForm, nome: e.target.value})}
                    placeholder="ex.: ENEM 2025 — Redação"
                    maxLength={60}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Visibilidade *</label>
                  <select
                    className="form-select"
                    value={roomForm.visibilidade}
                    onChange={(e) => setRoomForm({...roomForm, visibilidade: e.target.value as 'public' | 'private'})}
                  >
                    <option value="public">Pública</option>
                    <option value="private">Privada</option>
                  </select>
                </div>
                <div className="form-field full">
                  <label className="form-label">Descrição *</label>
                  <textarea
                    className="form-textarea"
                    value={roomForm.descricao}
                    onChange={(e) => setRoomForm({...roomForm, descricao: e.target.value})}
                    placeholder="Objetivo, regras gerais, rotina..."
                  />
                </div>
              </div>

              <div className="divider"></div>

              <div className="form-grid">
                <div className="form-field">
                  <label className="form-label">Máximo de pessoas</label>
                  <input
                    className="form-input"
                    type="number"
                    min="2"
                    max="999"
                    value={roomForm.max}
                    onChange={(e) => setRoomForm({...roomForm, max: e.target.value})}
                    placeholder="ex.: 50"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Tipo de conteúdo permitido</label>
                  <div className="checkbox-chips">
                    {['chat', 'arquivos', 'cards', 'voz'].map(type => (
                      <label key={type} className="checkbox-chip">
                        <input
                          type="checkbox"
                          checked={roomForm.allowed.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRoomForm({...roomForm, allowed: [...roomForm.allowed, type]});
                            } else {
                              setRoomForm({...roomForm, allowed: roomForm.allowed.filter(t => t !== type)});
                            }
                          }}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-field full">
                  <label className="form-label">Convidar amigos</label>
                  <div className="checkbox-chips">
                    {friends.map(friend => (
                      <label key={friend.id} className="checkbox-chip">
                        <input
                          type="checkbox"
                          checked={roomForm.convidados.includes(friend.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRoomForm({...roomForm, convidados: [...roomForm.convidados, friend.id]});
                            } else {
                              setRoomForm({...roomForm, convidados: roomForm.convidados.filter(id => id !== friend.id)});
                            }
                          }}
                        />
                        {friend.nome}
                      </label>
                    ))}
                  </div>
                  <div className="text-xs muted">
                    (mock) Se a sala for privada, convidados entram automaticamente.
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <div className="muted text-sm">
                Preencha os campos obrigatórios marcados com *
              </div>
              <div className="grow"></div>
              <button 
                className="btn-sala btn-outline"
                onClick={() => setRoomForm({
                  nome: '',
                  descricao: '',
                  visibilidade: 'public',
                  max: '',
                  allowed: [],
                  convidados: []
                })}
              >
                <RotateCcw className="h-4 w-4" />
                Limpar
              </button>
              <button 
                className="btn-sala btn-primary"
                onClick={handleSaveRoom}
              >
                <Save className="h-4 w-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}