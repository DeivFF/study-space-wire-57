import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function Perfil() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // States
  const [relationshipState, setRelationshipState] = useState('not_friend_public');
  const [pendingRequest, setPendingRequest] = useState(false);
  const [following, setFollowing] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Mock data
  const VISITOR = { id: 'u-maria', name: 'Maria' };

  const BASE_PROFILE = {
    id: 'u-joao',
    name: 'João Silva',
    username: 'joao.s',
    avatarUrl: '',
    bio: 'Estudante de exatas. Aficionado por álgebra e corridas de rua.',
    private: false,
    deactivated: false,
    deleted: false,
    settings: { messagesFrom: 'friends' },
    features: { follow: true, messaging: true },
    counters: { friends: 128, common: 5, posts: 12, photos: 8 },
    posts: [
      { id: 'p1', title: 'Mapa mental: Funções', excerpt: 'Resumo visual de funções e gráficos.' },
      { id: 'p2', title: 'Checklist ENEM', excerpt: 'Roteiro de revisão para a semana.' },
      { id: 'p3', title: 'Flashcards de Álgebra', excerpt: 'Conjunto com 40 cards.' },
    ],
    about: {
      cidade: 'Paraty, RJ',
      interesses: ['Matemática', 'Corrida', 'Café'],
      contato: { email: 'joao@example.com', visivelParaAmigos: true }
    }
  };

  const PROFILE_EXTRA = {
    stats: { weekMinutes: 380, accuracy: 78, solved: 120, weekTrend: [30, 45, 60, 55, 80, 65, 45], top: [['Matemática', 56], ['Direito', 44]] },
    activity: [
      { type: 'lesson', text: 'Concluiu "Interpretação de Texto"', ts: Date.now() - 1000 * 60 * 50 },
      { type: 'questions', text: 'Praticou 20 questões de Matemática', ts: Date.now() - 1000 * 60 * 80 },
      { type: 'post', text: 'Publicou um resumo: "Resumo de Porcentagem"', ts: Date.now() - 1000 * 60 * 140 },
    ],
    rooms: {
      active: [{ id: 'r1', title: 'Foco: Funções', participants: 2 }],
      recent: [{ id: 'r0', title: 'Revisão Constitucional', participants: 3 }]
    },
    communities: [
      { id: 'c1', name: 'RLM — Raciocínio Lógico', members: 1540 },
      { id: 'c2', name: 'Direito Constitucional BR', members: 870 }
    ]
  };

  const FRIENDS = [
    { id: 'f1', name: 'Beatriz Lima', username: 'bea.lima' },
    { id: 'f2', name: 'Carlos Nogueira', username: 'carlos.ng' },
    { id: 'f3', name: 'Ana Souza', username: 'ana.souza' },
    { id: 'f4', name: 'Pedro Alves', username: 'pedro.alv' },
    { id: 'f5', name: 'Luiza Rocha', username: 'lu.rocha' },
    { id: 'f6', name: 'Rafael Costa', username: 'rafa.costa' }
  ];

  // Helper functions
  const escapeHtml = (s = '') => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]) || c);
  const minutesToHhMm = (m) => {
    const h = Math.floor(m / 60);
    const mm = String(m % 60).padStart(2, '0');
    return `${h}h ${mm}m`;
  };
  const timeAgo = (ts) => {
    const d = Math.floor((Date.now() - ts) / 60000);
    if (d < 1) return 'agora';
    if (d < 60) return d + ' min';
    const h = Math.floor(d / 60);
    return h + ' h';
  };

  const currentProfileByState = (state) => {
    const p = JSON.parse(JSON.stringify(BASE_PROFILE));
    switch (state) {
      case 'friend': p.private = false; p.deactivated = false; p.deleted = false; break;
      case 'not_friend_public': p.private = false; break;
      case 'not_friend_private': p.private = true; break;
      case 'blocked': p.private = true; break;
      case 'deactivated': p.deactivated = true; break;
      case 'deleted': p.deleted = true; break;
    }
    return p;
  };

  const profile = currentProfileByState(relationshipState);

  const handleAction = (action, data = null) => {
    switch (action) {
      case 'add-friend':
        setPendingRequest(true);
        alert('Solicitação de amizade enviada.');
        break;
      case 'cancel-request':
        setPendingRequest(false);
        break;
      case 'unfriend':
        if (confirm('Remover dos amigos?')) {
          setRelationshipState('not_friend_public');
          setPendingRequest(false);
        }
        break;
      case 'message':
        alert('Abrir chat (mock)');
        break;
      case 'follow':
        setFollowing(!following);
        break;
      case 'join-room':
        alert('Entrando na sala… (mock)');
        break;
      case 'reopen-room':
        alert('Reabrindo sala… (mock)');
        break;
      case 'open-community':
        alert('Abrir comunidade… (mock)');
        break;
      case 'friends-all':
        alert('Abrir lista completa de amigos… (mock)');
        break;
      default:
        break;
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // CSS styles
  const styles = `
    :root {
      --bg: #f6f7fb;
      --bg-soft: #ffffff;
      --panel: #ffffff;
      --muted: #f1f3f8;
      --border: #e2e7f0;
      --text: #12131a;
      --text-muted: #5e6470;
      --accent: #2962ff;
      --accent-2: #00b8ff;
      --ok: #1e8e3e;
      --warn: #ba8b00;
      --danger: #d93025;
      --shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      --radius: 14px;
    }
    .dark-theme {
      --bg: #0b0c0f;
      --bg-soft: #111318;
      --panel: #0e1014;
      --muted: #141823;
      --border: #222633;
      --text: #e6e7eb;
      --text-muted: #a2a8b5;
      --accent: #6ea8fe;
      --accent-2: #8bd3ff;
      --ok: #56d364;
      --warn: #ffb300;
      --danger: #ff6b6b;
      --shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    }

    .perfil-page {
      min-height: 100vh;
      background: var(--bg);
      color: var(--text);
      font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial;
      font-size: 14px;
      line-height: 1.35;
    }

    .perfil-app { display: flex; min-height: 100vh; width: 100%; overflow: hidden; }
    .perfil-sidebar { width: 248px; background: var(--bg-soft); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; }
    .perfil-sb-h { padding: 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }
    .perfil-sb-nav { padding: 10px; display: flex; flex-direction: column; gap: 6px; overflow: auto; }
    .perfil-nav-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 12px; border: 1px solid transparent; color: var(--text); text-decoration: none; cursor: pointer; }
    .perfil-nav-item:hover { background: var(--muted); }
    .perfil-nav-item.active { background: color-mix(in oklab, var(--accent) 12%, var(--bg)); border-color: color-mix(in oklab, var(--accent) 35%, var(--border)); }
    .perfil-sb-footer { margin-top: auto; padding: 10px; border-top: 1px solid var(--border); }
    .perfil-user-toggle { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 12px; cursor: pointer; }

    .perfil-content { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .perfil-header { position: sticky; top: 0; z-index: 10; background: var(--panel); border-bottom: 1px solid var(--border); padding: 12px 16px; display: flex; align-items: center; gap: 10px; }

    .perfil-btn { border: 1px solid transparent; background: color-mix(in oklab, var(--bg) 60%, var(--panel)); color: var(--text); padding: 8px 10px; border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: var(--shadow); }
    .perfil-btn:hover { filter: brightness(1.04); }
    .perfil-btn:active { transform: translateY(1px); }
    .perfil-btn-outline { background: transparent; border-color: var(--border); box-shadow: none; }
    .perfil-btn-primary { background: linear-gradient(90deg, var(--accent), var(--accent-2)); color: #fff; font-weight: 600; }
    .perfil-btn[disabled] { opacity: 0.55; cursor: not-allowed; filter: none; }

    .perfil-content-body { display: grid; grid-template-columns: 1fr; gap: 14px; padding: 14px; align-items: start; }
    .perfil-card { background: var(--bg-soft); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
    .perfil-card-h { padding: 12px 12px 8px 12px; display: flex; gap: 10px; align-items: flex-start; }
    .perfil-card-c { padding: 12px; }

    .perfil-badge { display: inline-flex; align-items: center; gap: 6px; padding: 3px 8px; border-radius: 999px; font-size: 11px; border: 1px solid transparent; background: color-mix(in oklab, var(--bg) 60%, var(--panel)); }
    .perfil-badge-outline { background: transparent; border-color: var(--border); }
    .perfil-badge-ok { background: color-mix(in oklab, var(--ok) 20%, var(--bg)); color: color-mix(in oklab, var(--ok) 70%, black); border-color: color-mix(in oklab, var(--ok) 30%, var(--border)); }

    .perfil-profile-hero { display: grid; grid-template-columns: 96px 1fr; gap: 14px; align-items: center; }
    .perfil-avatar { width: 96px; height: 96px; border-radius: 999px; background: linear-gradient(135deg, var(--muted), transparent); display: flex; align-items: center; justify-content: center; border: 2px solid var(--border); overflow: hidden; }
    .perfil-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .perfil-avatar .initial { font-weight: 700; font-size: 28px; color: var(--text-muted); }

    .perfil-action-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .perfil-state-banner { display: flex; gap: 10px; align-items: flex-start; border: 1px dashed var(--border); background: color-mix(in oklab, var(--bg) 50%, var(--panel)); padding: 10px; border-radius: 12px; }

    .perfil-grid { display: grid; gap: 12px; }
    .perfil-grid.cards { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    @media (min-width: 640px) { .perfil-grid.cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (min-width: 1280px) { .perfil-grid.cards { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

    .perfil-profile-split { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; align-items: start; }
    @media (max-width: 1023px) { .perfil-profile-split { grid-template-columns: 1fr; } }

    .perfil-friends-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
    @media (max-width: 480px) { .perfil-friends-list { grid-template-columns: 1fr; } }
    .perfil-friend-card { display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid var(--border); border-radius: 12px; }

    .perfil-progress { background: var(--muted); height: 8px; border-radius: 999px; overflow: hidden; }
    .perfil-chip { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; font-size: 12px; border: 1px solid var(--border); background: var(--bg); }

    .perfil-mini-bars { display: flex; gap: 6px; align-items: flex-end; height: 48px; }
    .perfil-mini-bar { width: 16px; background: linear-gradient(180deg, var(--accent), var(--accent-2)); border-radius: 6px; }

    .row { display: flex; align-items: center; }
    .col { display: flex; flex-direction: column; }
    .grow { flex: 1; }
    .gap-1 { gap: 0.25rem; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .muted { color: var(--text-muted); }
    .text-sm { font-size: 12px; }
    .text-xs { font-size: 11px; }
    .text-lg { font-size: 18px; }
    .text-xl { font-size: 20px; font-weight: 600; }
    .bold { font-weight: 600; }
  `;

  useEffect(() => {
    // Add styles to head
    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);

    return () => {
      // Cleanup styles on unmount
      document.head.removeChild(styleElement);
    };
  }, []);

  if (profile.deleted) {
    return (
      <div className={`perfil-page ${isDark ? 'dark-theme' : ''}`}>
        <div className="perfil-card">
          <div className="perfil-card-c">
            <div className="perfil-state-banner">
              <span>🚫</span>
              <div>
                <div className="text-lg bold">Conta excluída</div>
                <div className="text-sm muted">Este perfil não está mais disponível.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profile.deactivated) {
    return (
      <div className={`perfil-page ${isDark ? 'dark-theme' : ''}`}>
        <div className="perfil-card">
          <div className="perfil-card-c">
            <div className="perfil-state-banner">
              <span>⛔</span>
              <div>
                <div className="text-lg bold">Perfil desativado</div>
                <div className="text-sm muted">{profile.name} desativou temporariamente a conta.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (relationshipState === 'blocked') {
    return (
      <div className={`perfil-page ${isDark ? 'dark-theme' : ''}`}>
        <div className="perfil-card">
          <div className="perfil-card-c">
            <div className="perfil-state-banner">
              <span>🛡️</span>
              <div>
                <div className="text-lg bold">Você não tem permissão para visualizar este perfil</div>
                <div className="text-sm muted">A visualização foi restringida por configurações de bloqueio.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canMessage = profile.features.messaging && (
    profile.settings.messagesFrom === 'everyone' ||
    (profile.settings.messagesFrom === 'friends' && relationshipState === 'friend')
  );

  const canSeeContent = (relationshipState === 'friend' || (!profile.private));

  const renderActions = () => {
    const items = [];
    if (relationshipState === 'friend') {
      items.push(
        <button 
          key="message" 
          className={`perfil-btn ${!canMessage ? 'disabled' : ''}`} 
          disabled={!canMessage}
          onClick={() => handleAction('message')}
        >
          💬 Enviar mensagem
        </button>
      );
      items.push(
        <button 
          key="unfriend" 
          className="perfil-btn perfil-btn-outline" 
          onClick={() => handleAction('unfriend')}
        >
          ❌ Desfazer amizade
        </button>
      );
      if (profile.features.follow) {
        items.push(
          <button 
            key="follow" 
            className="perfil-btn perfil-btn-outline" 
            onClick={() => handleAction('follow')}
          >
            {following ? '➖ Deixar de seguir' : '➕ Seguir'}
          </button>
        );
      }
    } else {
      if (relationshipState === 'not_friend_public' || relationshipState === 'not_friend_private') {
        if (pendingRequest) {
          items.push(
            <button 
              key="cancel-request" 
              className="perfil-btn perfil-btn-outline" 
              onClick={() => handleAction('cancel-request')}
            >
              ⏰ Solicitação enviada
            </button>
          );
        } else {
          items.push(
            <button 
              key="add-friend" 
              className="perfil-btn perfil-btn-primary" 
              onClick={() => handleAction('add-friend')}
            >
              ➕ Adicionar amigo
            </button>
          );
        }
        items.push(
          <button 
            key="message" 
            className={`perfil-btn ${!canMessage ? 'disabled' : ''}`} 
            disabled={!canMessage}
            onClick={() => handleAction('message')}
          >
            💬 Enviar mensagem
          </button>
        );
        if (profile.features.follow) {
          items.push(
            <button 
              key="follow" 
              className="perfil-btn perfil-btn-outline" 
              onClick={() => handleAction('follow')}
            >
              {following ? '➖ Deixar de seguir' : '➕ Seguir'}
            </button>
          );
        }
      }
    }
    return items;
  };

  return (
    <div className={`perfil-page ${isDark ? 'dark-theme' : ''}`}>
      <div className="perfil-app">
        {/* Sidebar */}
        <aside className="perfil-sidebar">
          <div className="perfil-sb-h">
            <span>🧭</span>
            <div className="text-lg bold">Navegação</div>
          </div>
          <nav className="perfil-sb-nav">
            <div className="perfil-nav-item" onClick={() => navigate('/questoes')}>
              <span>❓</span> <span>Questões</span>
            </div>
            <div className="perfil-nav-item" onClick={() => navigate('/aulas')}>
              <span>🎓</span> <span>Aulas</span>
            </div>
            <div className="perfil-nav-item" onClick={() => navigate('/amigos')}>
              <span>👥</span> <span>Amigos</span>
            </div>
            <div className="perfil-nav-item active">
              <span>👤</span> <span>Perfil</span>
            </div>
          </nav>
          <div className="perfil-sb-footer">
            <div className="perfil-user-toggle">
              <span>👤</span>
              <div className="grow bold">Usuário</div>
              <span>⬇️</span>
            </div>
          </div>
        </aside>

        {/* Content */}
        <main className="perfil-content">
          <div className="perfil-header">
            <span>👤</span>
            <div className="text-xl">Perfil</div>
            <div className="grow"></div>
            <div className="row gap-2 text-sm" style={{ marginRight: '8px' }}>
              <span>👁️</span>
              <select 
                className="perfil-btn perfil-btn-outline" 
                value={relationshipState}
                onChange={(e) => setRelationshipState(e.target.value)}
              >
                <option value="not_friend_public">A — Não amigo (público)</option>
                <option value="friend">B — Amigo já adicionado</option>
                <option value="not_friend_private">C — Não amigo (privado)</option>
                <option value="blocked">D — Bloqueado</option>
                <option value="deactivated">Perfil desativado</option>
                <option value="deleted">Conta excluída</option>
              </select>
            </div>
            <button className="perfil-btn perfil-btn-outline" onClick={toggleTheme}>
              <span>{isDark ? '☀️' : '🌙'}</span>
              <span className="text-sm">Tema</span>
            </button>
          </div>

          <div className="perfil-content-body">
            {/* Profile Hero */}
            <div className="perfil-card">
              <div className="perfil-card-c">
                <div className="perfil-profile-hero">
                  <div className="perfil-avatar">
                    {profile.avatarUrl ? 
                      <img src={profile.avatarUrl} alt={`Avatar de ${profile.name}`} /> :
                      <span className="initial">{profile.name.charAt(0)}</span>
                    }
                  </div>
                  <div>
                    <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
                      <div className="text-xl">{profile.name}</div>
                      <span className="perfil-badge perfil-badge-outline">@{profile.username}</span>
                      {relationshipState === 'friend' ? 
                        <span className="perfil-badge perfil-badge-ok">
                          <span>✅</span> Amigos
                        </span> :
                        <span className="perfil-badge perfil-badge-outline">
                          <span>➕</span> Não são amigos
                        </span>
                      }
                      {profile.private && relationshipState !== 'friend' && 
                        <span className="perfil-badge perfil-badge-outline">
                          <span>🔒</span> Perfil privado
                        </span>
                      }
                    </div>
                    {profile.bio && 
                      <div className="text-sm muted" style={{ marginTop: '6px' }}>
                        {profile.bio}
                      </div>
                    }
                    <div className="perfil-action-row">
                      {renderActions()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content based on permissions */}
            {canSeeContent ? (
              <div className="perfil-profile-split">
                <div>
                  {/* Posts */}
                  <div className="perfil-card">
                    <div className="perfil-card-h">
                      <span>📋</span>
                      <div className="bold">Publicações</div>
                    </div>
                    <div className="perfil-card-c">
                      <div className="perfil-grid cards">
                        {profile.posts.map(p => (
                          <div key={p.id} className="perfil-card">
                            <div className="perfil-card-c">
                              <div className="bold">{p.title}</div>
                              <div className="text-sm muted" style={{ marginTop: '6px' }}>
                                {p.excerpt}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  <div className="perfil-card" style={{ marginTop: '12px' }}>
                    <div className="perfil-card-h">
                      <span>ℹ️</span>
                      <div className="bold">Sobre</div>
                    </div>
                    <div className="perfil-card-c">
                      <div className="row gap-2">
                        <span>📍</span>
                        <div className="text-sm">{profile.about.cidade}</div>
                      </div>
                      <div className="row gap-2" style={{ marginTop: '6px' }}>
                        <span>✨</span>
                        <div className="text-sm">
                          Interesses: {profile.about.interesses.join(', ')}
                        </div>
                      </div>
                      {relationshipState === 'friend' && profile.about.contato.visivelParaAmigos && 
                        <div className="row gap-2" style={{ marginTop: '6px' }}>
                          <span>📧</span>
                          <a className="text-sm" href={`mailto:${profile.about.contato.email}`}>
                            {profile.about.contato.email}
                          </a>
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <div>
                  {/* Overview */}
                  <div className="perfil-grid" style={{ gap: '12px' }}>
                    <div className="perfil-card">
                      <div className="perfil-card-h">
                        <span>📈</span>
                        <div className="bold">Indicadores principais</div>
                      </div>
                      <div className="perfil-card-c">
                        <div className="row gap-4" style={{ flexWrap: 'wrap' }}>
                          <div className="col">
                            <div className="text-sm muted">Tempo (semana)</div>
                            <div className="bold">{minutesToHhMm(PROFILE_EXTRA.stats.weekMinutes)}</div>
                          </div>
                          <div className="col">
                            <div className="text-sm muted">Acerto médio</div>
                            <div className="bold">{PROFILE_EXTRA.stats.accuracy}%</div>
                          </div>
                          <div className="col">
                            <div className="text-sm muted">Questões resolvidas</div>
                            <div className="bold">{PROFILE_EXTRA.stats.solved}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="perfil-card">
                      <div className="perfil-card-h">
                        <span>⏰</span>
                        <div className="bold">Atividade recente</div>
                      </div>
                      <div className="perfil-card-c">
                        {PROFILE_EXTRA.activity.map((a, i) => (
                          <div key={i} className="row gap-2" style={{ marginBottom: '8px' }}>
                            <span>{a.type === 'lesson' ? '📚' : (a.type === 'questions' ? '❓' : '📄')}</span>
                            <div className="text-sm">{a.text}</div>
                            <span className="text-xs muted">{timeAgo(a.ts)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Friends */}
                  <div className="perfil-card" style={{ marginTop: '12px' }}>
                    <div className="perfil-card-h">
                      <span>👥</span>
                      <div className="bold">Amigos</div>
                    </div>
                    <div className="perfil-card-c">
                      <div className="perfil-friends-list">
                        {FRIENDS.slice(0, 6).map(f => (
                          <div key={f.id} className="perfil-friend-card">
                            <div 
                              style={{
                                width: '28px',
                                height: '28px',
                                border: '1px solid var(--border)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '700'
                              }}
                            >
                              {f.name.charAt(0)}
                            </div>
                            <div>
                              <div className="bold text-sm">{f.name}</div>
                              <div className="text-xs muted">@{f.username}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="row" style={{ marginTop: '10px', justifyContent: 'flex-end' }}>
                        <button 
                          className="perfil-btn perfil-btn-outline" 
                          onClick={() => handleAction('friends-all')}
                        >
                          Ver todos
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="perfil-card">
                <div className="perfil-card-c">
                  <div className="perfil-state-banner">
                    <span>🔒</span>
                    <div>
                      <div className="bold">Este perfil é privado</div>
                      <div className="text-sm muted">
                        Envie uma solicitação de amizade para ver as publicações e detalhes.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}