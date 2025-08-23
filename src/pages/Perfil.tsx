import { useParams } from 'react-router-dom';

export default function Perfil() {
  const { id } = useParams<{ id: string }>();

  return (
    <div 
      dangerouslySetInnerHTML={{
        __html: `
<!DOCTYPE html>
<html lang="pt-BR" data-theme="auto">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Plataforma de Estudos — Perfil</title>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    /* =====================================
       Design tokens e utilitários (mesmo estilo)
       ===================================== */
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
    [data-theme="dark"] {
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

    *{box-sizing:border-box}
    html,body{height:100%}
    body{margin:0;background:var(--bg);color:var(--text);font:14px/1.35 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial}

    .row{display:flex;align-items:center}
    .col{display:flex;flex-direction:column}
    .grow{flex:1}
    .gap-1{gap:.25rem}.gap-2{gap:.5rem}.gap-3{gap:.75rem}.gap-4{gap:1rem}
    .muted{color:var(--text-muted)}
    .panel{background:var(--panel)}
    .brd{border:1px solid var(--border)}
    .rounded{border-radius:var(--radius)}
    .text-sm{font-size:12px}.text-xs{font-size:11px}.text-lg{font-size:18px}.text-xl{font-size:20px;font-weight:600}
    .bold{font-weight:600}
    .capitalize{text-transform:capitalize}
    .center{text-align:center}

    .app{display:flex;min-height:100vh;width:100%;overflow:hidden}

    /* Sidebar (mantida para consistência visual) */
    .sidebar{width:248px;background:var(--bg-soft);border-right:1px solid var(--border);display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
    .sb-h{padding:14px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
    .sb-nav{padding:10px;display:flex;flex-direction:column;gap:6px;overflow:auto}
    .nav-item{display:flex;align-items:center;gap:10px;padding:10px 10px;border-radius:12px;border:1px solid transparent;color:var(--text);text-decoration:none}
    .nav-item:hover{background:var(--muted)}
    .nav-item.active{background:color-mix(in oklab,var(--accent) 12%, var(--bg));border-color:color-mix(in oklab,var(--accent) 35%, var(--border))}
    .sb-footer{margin-top:auto;padding:10px;border-top:1px solid var(--border)}
    .user-toggle{display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;cursor:pointer}
    .user-sub{margin-top:6px;padding-left:26px;display:none}
    .user-sub a{display:flex;align-items:center;gap:8px;padding:8px;border-radius:10px;color:var(--text);text-decoration:none}
    .user-sub a:hover{background:var(--muted)}

    /* Header */
    .content{display:flex;flex-direction:column;min-width:0;flex:1}
    .header{position:sticky;top:0;z-index:10;background:var(--panel);border-bottom:1px solid var(--border);padding:12px 16px;display:flex;align-items:center;gap:10px}

    /* Buttons */
    .btn{border:1px solid transparent;background:color-mix(in oklab,var(--bg) 60%, var(--panel));color:var(--text);padding:8px 10px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:var(--shadow)}
    .btn:hover{filter:brightness(1.04)}
    .btn:active{transform:translateY(1px)}
    .btn-outline{background:transparent;border-color:var(--border);box-shadow:none}
    .btn-ghost{background:transparent;border-color:transparent;box-shadow:none}
    .btn-primary{background:linear-gradient(90deg,var(--accent),var(--accent-2));color:#fff;font-weight:600}
    .btn-danger{background:color-mix(in oklab,var(--danger) 20%, var(--panel));color:color-mix(in oklab,var(--danger) 80%, #111)}
    .btn-icon{width:36px;height:36px;justify-content:center;padding:0}
    .btn[disabled]{opacity:.55;cursor:not-allowed;filter:none}

    /* Layout principal do perfil */
    .content-body{display:grid;grid-template-columns:1fr;gap:14px;padding:14px;align-items:start}
    @media(max-width:1023px){.content-body{grid-template-columns:1fr}}

    .card{background:var(--bg-soft);border:1px solid var(--border);border-radius:16px;overflow:hidden}
    .card .card-h{padding:12px 12px 8px 12px;display:flex;gap:10px;align-items:flex-start}
    .card .card-c{padding:12px}

    .badge{display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border-radius:999px;font-size:11px;border:1px solid transparent;background:color-mix(in oklab,var(--bg) 60%, var(--panel))}
    .badge-outline{background:transparent;border-color:var(--border)}
    .badge-ok{background:color-mix(in oklab,var(--ok) 20%, var(--bg));color:color-mix(in oklab,var(--ok) 70%, black);border-color:color-mix(in oklab,var(--ok) 30%, var(--border))}
    .chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;font-size:12px;border:1px solid var(--border);background:var(--bg)}

    /* Perfil: hero */
    .profile-hero{display:grid;grid-template-columns:96px 1fr;gap:14px;align-items:center}
    .avatar{width:96px;height:96px;border-radius:999px;background:linear-gradient(135deg,var(--muted),transparent);display:flex;align-items:center;justify-content:center;border:2px solid var(--border);overflow:hidden}
    .avatar img{width:100%;height:100%;object-fit:cover}
    .avatar .initial{font-weight:700;font-size:28px;color:var(--text-muted)}

    .action-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}

    /* Grid de postagens */
    .grid{display:grid;gap:12px}
    .grid.cards{grid-template-columns:repeat(1,minmax(0,1fr))}
    @media(min-width:640px){.grid.cards{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(min-width:1280px){.grid.cards{grid-template-columns:repeat(3,minmax(0,1fr))}}

    .empty{border:1px dashed var(--border);border-radius:16px;padding:24px;text-align:center;color:var(--text-muted)}

    /* ====== utilitários extras para as seções ====== */
    .list{border:1px solid var(--border);border-radius:14px;overflow:hidden;background:var(--bg-soft)}
    .list-head,.list-row{display:grid;grid-template-columns:1fr 120px 100px 160px 80px;gap:8px;padding:8px 10px}
    .list-head{color:var(--text-muted)}
    .list-row{align-items:center}
    .list-row:hover{background:color-mix(in oklab,var(--muted) 60%, transparent)}
    .progress{background:var(--muted);height:8px;border-radius:999px;overflow:hidden}

    .pills{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
    .pill{padding:6px 10px;border:1px solid var(--border);border-radius:999px;cursor:pointer;background:var(--bg);font-size:12px}
    .pill.active{background:color-mix(in oklab,var(--accent) 15%, var(--bg));border-color:color-mix(in oklab,var(--accent) 40%, var(--border))}

    .mini-bars{display:flex;gap:6px;align-items:flex-end;height:48px}

    /* Amigos compactos */
    .friends-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
    @media(max-width:480px){.friends-list{grid-template-columns:1fr}}
    .friend-card{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--border);border-radius:12px}

    /* Banner de estados restritivos */
    .state-banner{display:flex;gap:10px;align-items:flex-start;border:1px dashed var(--border);background:color-mix(in oklab,var(--bg) 50%, var(--panel));padding:10px;border-radius:12px}

    /* Layout interno: publicações 2/3 + seções (1/3) */
    .profile-split{display:grid;grid-template-columns:2fr 1fr;gap:14px;align-items:start}
    @media(max-width:1023px){.profile-split{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="app">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sb-h"><i data-lucide="compass"></i><div class="text-lg bold">Navegação</div></div>
      <nav class="sb-nav">
        <a class="nav-item" href="#"><i data-lucide="help-circle"></i> <span>Questões</span></a>
        <a class="nav-item" href="#"><i data-lucide="graduation-cap"></i> <span>Aulas</span></a>
        <a class="nav-item" href="#"><i data-lucide="users"></i> <span>Amigos</span></a>
        <a class="nav-item active" href="#"><i data-lucide="user"></i> <span>Perfil</span></a>
      </nav>
      <div class="sb-footer">
        <div class="user-toggle" id="userToggle">
          <i data-lucide="user"></i>
          <div class="grow bold">Usuário</div>
          <i data-lucide="chevron-down" class="user-chevron" style="transition:transform .15s"></i>
        </div>
        <div class="user-sub" id="userSub">
          <a href="#"><i data-lucide="layout-dashboard"></i> Dashboard</a>
          <a href="#"><i data-lucide="settings"></i> Configurações</a>
          <a href="#"><i data-lucide="log-out"></i> Sair</a>
        </div>
      </div>
    </aside>

    <!-- Conteúdo -->
    <main class="content">
      <div class="header">
        <i data-lucide="user"></i>
        <div class="text-xl">Perfil</div>
        <div class="grow"></div>
        <div class="row gap-2 text-sm" title="Pré-visualizar cenários" style="margin-right:8px">
          <i data-lucide="eye"></i>
          <select id="scenario" class="btn btn-outline" aria-label="Selecionar cenário">
            <option value="not_friend_public">A — Não amigo (público)</option>
            <option value="friend">B — Amigo já adicionado</option>
            <option value="not_friend_private">C — Não amigo (privado)</option>
            <option value="blocked">D — Bloqueado</option>
            <option value="deactivated">Perfil desativado</option>
            <option value="deleted">Conta excluída</option>
          </select>
        </div>
        <button class="btn btn-outline" id="themeToggle" title="Alternar tema"><i data-lucide="moon"></i><span class="text-sm">Tema</span></button>
      </div>

      <div class="content-body">
        <!-- Coluna principal -->
        <div id="mainArea"></div>
      </div>
    </main>
  </div>

  <script>
    // =====================
    // Tema
    // =====================
    const Theme = {
      get(){
        const stored = localStorage.getItem('theme');
        if(stored==='dark' || stored==='light') return stored;
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      },
      set(next){ localStorage.setItem('theme', next); apply(next); },
      toggle(){ const curr = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark':'light'; this.set(curr==='dark' ? 'light' : 'dark'); }
    };
    function apply(mode){
      document.documentElement.setAttribute('data-theme', mode);
      const btn = document.getElementById('themeToggle');
      if(btn){ const icon = btn.querySelector('i'); if(icon){ icon.setAttribute('data-lucide', mode==='dark' ? 'sun' : 'moon'); } btn.title = mode==='dark' ? 'Modo claro' : 'Modo escuro'; }
      if(window.lucide) lucide.createIcons();
    }
    apply(Theme.get());

    // =====================
    // Mock de Dados do Perfil / Visitante
    // =====================
    const VISITOR = { id: 'u-maria', name: 'Maria' };

    const BASE_PROFILE = {
      id: 'u-joao',
      name: 'João Silva',
      username: 'joao.s',
      avatarUrl: '', // vazio = usar iniciais
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

    // ===== Dados adicionais das seções =====
    const PROFILE_EXTRA = {
      stats: { weekMinutes: 380, accuracy: 78, solved: 120, weekTrend: [30, 45, 60, 55, 80, 65, 45], top: [ ['Matemática', 56], ['Direito', 44 ] ] },
      activity: [
        { type:'lesson', text:'Concluiu "Interpretação de Texto"', ts: Date.now() - 1000*60*50 },
        { type:'questions', text:'Praticou 20 questões de Matemática', ts: Date.now() - 1000*60*80 },
        { type:'post', text:'Publicou um resumo: "Resumo de Porcentagem"', ts: Date.now() - 1000*60*140 },
      ],
      rooms: {
        active: [ { id:'r1', title:'Foco: Funções', participants: 2 } ],
        recent: [ { id:'r0', title:'Revisão Constitucional', participants: 3 } ]
      },
      communities: [
        { id:'c1', name:'RLM — Raciocínio Lógico', members: 1540 },
        { id:'c2', name:'Direito Constitucional BR', members: 870 }
      ]
    };

    // Amigos (mock)
    const FRIENDS = [
      {id:'f1', name:'Beatriz Lima', username:'bea.lima'},
      {id:'f2', name:'Carlos Nogueira', username:'carlos.ng'},
      {id:'f3', name:'Ana Souza', username:'ana.souza'},
      {id:'f4', name:'Pedro Alves', username:'pedro.alv'},
      {id:'f5', name:'Luiza Rocha', username:'lu.rocha'},
      {id:'f6', name:'Rafael Costa', username:'rafa.costa'}
    ];

    // Estados
    let relationshipState = 'not_friend_public';
    let pendingRequest = false;
    let following = false;

    const $ = (s)=>document.querySelector(s);
    function escapeHtml(s=''){ return s.replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]) ); }
    function minutesToHhMm(m){ const h=Math.floor(m/60), mm=String(m%60).padStart(2,'0'); return \`\${h}h \${mm}m\`; }
    function timeAgo(ts){ const d = Math.floor((Date.now()-ts)/60000); if(d<1) return 'agora'; if(d<60) return d+' min'; const h=Math.floor(d/60); return h+ ' h'; }
    function tinyBars(arr){ const max = Math.max(...arr, 1); return \`<div class="mini-bars">\`+ arr.map(v=>\`<div title="\${v}" style="width:16px;height:\${Math.max(4, Math.round(44*v/max))}px;background:linear-gradient(180deg,var(--accent),var(--accent-2));border-radius:6px"></div>\`).join('')+ \`</div>\`; }

    // ===== Seções (sem abas) =====
    function renderOverview(){
      const S = PROFILE_EXTRA.stats;
      return \`
        <div class="grid" style="gap:12px">
          <div class="card">
            <div class="card-h"><i data-lucide="chart-line"></i><div class="bold">Indicadores principais</div></div>
            <div class="card-c">
              <div class="row gap-4" style="flex-wrap:wrap">
                <div class="col"><div class="text-sm muted">Tempo (semana)</div><div class="bold">\${minutesToHhMm(S.weekMinutes)}</div></div>
                <div class="col"><div class="text-sm muted">Acerto médio</div><div class="bold">\${S.accuracy}%</div></div>
                <div class="col"><div class="text-sm muted">Questões resolvidas</div><div class="bold">\${S.solved}</div></div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-h"><i data-lucide="clock"></i><div class="bold">Atividade recente</div></div>
            <div class="card-c">
              \${PROFILE_EXTRA.activity.map(a=>\`
                <div class="row gap-2" style="margin-bottom:8px">
                  <i data-lucide="\${a.type==='lesson'?'book':(a.type==='questions'?'help-circle':'file-text')}"></i>
                  <div class="text-sm">\${escapeHtml(a.text)}</div>
                  <span class="text-xs muted">\${timeAgo(a.ts)}</span>
                </div>
              \`).join('')}
            </div>
          </div>
        </div>\`;
    }

    function renderRoomsList(){
      const act = PROFILE_EXTRA.rooms.active.map(r=>\`
        <div class="row gap-2 brd rounded" style="padding:10px">
          <i data-lucide="radio"></i>
          <div class="grow"><div class="bold">\${escapeHtml(r.title)}</div><div class="text-xs muted">\${r.participants} estudando agora</div></div>
          <button class="btn" data-action="join-room" data-id="\${r.id}"><i data-lucide="log-in"></i> Entrar</button>
        </div>\`).join('');
      const rec = PROFILE_EXTRA.rooms.recent.map(r=>\`
        <div class="row gap-2 brd rounded" style="padding:10px">
          <i data-lucide="history"></i>
          <div class="grow"><div class="bold">\${escapeHtml(r.title)}</div><div class="text-xs muted">\${r.participants} participaram</div></div>
          <button class="btn btn-outline" data-action="reopen-room" data-id="\${r.id}"><i data-lucide="rotate-ccw"></i> Reabrir</button>
        </div>\`).join('');
      return \`
        <div class="col gap-2">
          <div class="text-sm muted">Salas ativas</div>
          \${act || '<div class="text-sm muted">Nenhuma no momento</div>'}
          <div class="text-sm muted" style="margin-top:8px">Recentes</div>
          \${rec || '<div class="text-sm muted">—</div>'}
        </div>\`;
    }

    function renderCommunitiesGrid(){
      return \`<div class="grid" style="gap:12px">\${PROFILE_EXTRA.communities.map(c=>\`
        <div class="card">
          <div class="card-h"><i data-lucide="users"></i><div class="grow"><div class="bold">\${escapeHtml(c.name)}</div><div class="text-xs muted">\${c.members} membros</div></div><button class="btn btn-outline" data-action="open-community" data-id="\${c.id}"><i data-lucide="arrow-right"></i> Ver</button></div>
        </div>\`).join('')}</div>\`;
    }

    function renderCommon(){
      return \`
        <div class="card" style="margin-top:12px">
          <div class="card-h"><i data-lucide="radio"></i><div class="bold">Salas</div></div>
          <div class="card-c">\${renderRoomsList()}</div>
        </div>
        <div class="card" style="margin-top:12px">
          <div class="card-h"><i data-lucide="users"></i><div class="bold">Comunidades</div></div>
          <div class="card-c">\${renderCommunitiesGrid()}</div>
        </div>\`;
    }

    function renderFriends(){
      const items = FRIENDS.slice(0,6).map(f=>\`
        <div class="friend-card">
          <div class="rounded" style="width:28px;height:28px;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-weight:700">\${escapeHtml(f.name.charAt(0))}</div>
          <div>
            <div class="bold text-sm">\${escapeHtml(f.name)}</div>
            <div class="text-xs muted">@\${escapeHtml(f.username)}</div>
          </div>
        </div>\`).join('');
      return \`
        <div class="card" style="margin-top:12px">
          <div class="card-h"><i data-lucide="users-2"></i><div class="bold">Amigos</div></div>
          <div class="card-c">
            <div class="friends-list">\${items || '<div class="text-sm muted">Nenhum amigo para mostrar</div>'}</div>
            <div class="row" style="margin-top:10px;justify-content:flex-end">
              <button class="btn btn-outline" data-action="friends-all">Ver todos</button>
            </div>
          </div>
        </div>\`;
    }

    function renderProgress(){
      const S = PROFILE_EXTRA.stats;
      return \`
        <div class="card" style="margin-top:12px">
          <div class="card-c">
            <div class="grid" style="gap:12px">
              <div class="card"><div class="card-h"><i data-lucide="clock"></i><div class="bold">Tempo de estudo (semana)</div></div><div class="card-c"><div class="text-xl bold">\${minutesToHhMm(S.weekMinutes)}</div>\${tinyBars(S.weekTrend)}</div></div>
              <div class="card"><div class="card-h"><i data-lucide="percent"></i><div class="bold">Taxa de acerto</div></div><div class="card-c"><div class="progress"><span style="display:block;height:10px;background:linear-gradient(90deg,var(--accent),var(--accent-2));border-radius:999px;width:\${S.accuracy}%"></span></div><div class="text-sm" style="margin-top:6px">\${S.accuracy}%</div></div></div>
              <div class="card"><div class="card-h"><i data-lucide="help-circle"></i><div class="bold">Questões resolvidas</div></div><div class="card-c"><div class="text-xl bold">\${S.solved}</div><div class="row gap-1" style="margin-top:8px;flex-wrap:wrap">\${S.top.map(([d,v])=>\`<span class=\\\"chip\\\"><i data-lucide=\\\"award\\\"></i> \${d}: \${v}%</span>\`).join('')}</div></div></div>
              <div class="card"><div class="card-h"><i data-lucide="trophy"></i><div class="bold">Conquistas</div></div><div class="card-c"><div class="row gap-1" style="flex-wrap:wrap"><span class="chip"><i data-lucide="award"></i> Maratona 7 dias</span><span class="chip"><i data-lucide="award"></i> 200 questões</span><span class="chip"><i data-lucide="award"></i> Top 10% Matemática</span></div></div></div>
            </div>
          </div>
        </div>\`;
    }

    function currentProfileByState(state){
      const p = JSON.parse(JSON.stringify(BASE_PROFILE));
      switch(state){
        case 'friend': p.private = false; p.deactivated = false; p.deleted = false; break;
        case 'not_friend_public': p.private = false; break;
        case 'not_friend_private': p.private = true; break;
        case 'blocked': p.private = true; break;
        case 'deactivated': p.deactivated = true; break;
        case 'deleted': p.deleted = true; break;
      }
      return p;
    }

    function render(){
      const main = document.getElementById('mainArea');
      const profile = currentProfileByState(relationshipState);

      // Casos restritivos globais
      if(profile.deleted){
        main.innerHTML = \`<div class=\\\"card\\\"><div class=\\\"card-c\\\">
          <div class=\\\"state-banner\\\">
            <i data-lucide=\\\"circle-slash\\\"></i>
            <div>
              <div class=\\\"text-lg bold\\\">Conta excluída</div>
              <div class=\\\"text-sm muted\\\">Este perfil não está mais disponível.</div>
            </div>
          </div>
        </div></div>\`;
        if(window.lucide) lucide.createIcons();
        return;
      }
      if(profile.deactivated){
        main.innerHTML = \`<div class=\\\"card\\\"><div class=\\\"card-c\\\">
          <div class=\\\"state-banner\\\">
            <i data-lucide=\\\"ban\\\"></i>
            <div>
              <div class=\\\"text-lg bold\\\">Perfil desativado</div>
              <div class=\\\"text-sm muted\\\">\${escapeHtml(profile.name)} desativou temporariamente a conta.</div>
            </div>
          </div>
        </div></div>\`;
        if(window.lucide) lucide.createIcons();
        return;
      }
      if(relationshipState === 'blocked'){
        main.innerHTML = \`<div class=\\\"card\\\"><div class=\\\"card-c\\\">
          <div class=\\\"state-banner\\\">
            <i data-lucide=\\\"shield-off\\\"></i>
            <div>
              <div class=\\\"text-lg bold\\\">Você não tem permissão para visualizar este perfil</div>
              <div class=\\\"text-sm muted\\\">A visualização foi restringida por configurações de bloqueio.</div>
            </div>
          </div>
        </div></div>\`;
        if(window.lucide) lucide.createIcons();
        return;
      }

      // Cabeçalho do perfil
      const canMessage = profile.features.messaging && (
        profile.settings.messagesFrom === 'everyone' ||
        (profile.settings.messagesFrom === 'friends' && relationshipState === 'friend')
      );

      const hero = \`
        <div class=\\\"card\\\">
          <div class=\\\"card-c\\\">
            <div class=\\\"profile-hero\\\">
              <div class=\\\"avatar\\\" aria-hidden=\\\"true\\\">\${profile.avatarUrl? \`<img src=\\\"\${profile.avatarUrl}\\\" alt=\\\"Avatar de \${escapeHtml(profile.name)}\\\">\` : \`<span class=\\\"initial\\\">\${escapeHtml(profile.name.charAt(0))}</span>\`}</div>
              <div>
                <div class=\\\"row gap-2\\\" style=\\\"flex-wrap:wrap\\\">
                  <div class=\\\"text-xl\\\">\${escapeHtml(profile.name)}</div>
                  <span class=\\\"badge badge-outline\\\">@\${escapeHtml(profile.username)}</span>
                  \${relationshipState==='friend' ? '<span class=\\\"badge badge-ok\\\"><i data-lucide=\\\"user-check\\\" style=\\\"width:14px;height:14px\\\"></i> Amigos</span>' : '<span class=\\\"badge badge-outline\\\"><i data-lucide=\\\"user-plus\\\" style=\\\"width:14px;height:14px\\\"></i> Não são amigos</span>'}
                  \${profile.private && relationshipState!=='friend' ? '<span class=\\\"badge badge-outline\\\"><i data-lucide=\\\"lock\\\" style=\\\"width:14px;height:14px\\\"></i> Perfil privado</span>' : ''}
                </div>
                \${profile.bio ? \`<div class=\\\"text-sm muted\\\" style=\\\"margin-top:6px\\\">\${escapeHtml(profile.bio)}</div>\`:''}
                <div class=\\\"action-row\\\">
                  \${renderActions(profile, canMessage)}
                </div>
              </div>
            </div>
          </div>
        </div>\`;

      // Seções (1/3) a serem empilhadas
      const canSeeContent = (relationshipState === 'friend' || (!profile.private));
      let sideStack = '';
      if (canSeeContent) {
        sideStack = \`\${renderOverview()}\${renderCommon()}\${renderFriends()}\`;
      }

      // Conteúdo principal (2/3)
      let content = '';
      if(canSeeContent){
        content += \`
          <div class=\\\"card\\\">
            <div class=\\\"card-h\\\"><i data-lucide=\\\"layout-grid\\\"></i><div class=\\\"bold\\\">Publicações</div></div>
            <div class=\\\"card-c\\\">
              <div class=\\\"grid cards\\\">
                \${profile.posts.map(p=>\`<div class=\\\\\\\"card\\\\\\\"><div class=\\\\\\\"card-c\\\\\\\"><div class=\\\\\\\"bold\\\\\\\">\${escapeHtml(p.title)}</div><div class=\\\\\\\"text-sm muted\\\\\\\" style=\\\\\\\"margin-top:6px\\\\\\\">\${escapeHtml(p.excerpt)}</div></div></div>\`).join('')}
              </div>
            </div>
          </div>

          <div class=\\\"card\\\" style=\\\"margin-top:12px\\\">
            <div class=\\\"card-h\\\"><i data-lucide=\\\"info\\\"></i><div class=\\\"bold\\\">Sobre</div></div>
            <div class=\\\"card-c\\\">
              <div class=\\\"row gap-2\\\"><i data-lucide=\\\"map-pin\\\"></i><div class=\\\"text-sm\\\">\${escapeHtml(profile.about.cidade)}</div></div>
              <div class=\\\"row gap-2\\\" style=\\\"margin-top:6px\\\"><i data-lucide=\\\"sparkles\\\"></i><div class=\\\"text-sm\\\">Interesses: \${profile.about.interesses.map(escapeHtml).join(', ')}</div></div>
              \${relationshipState==='friend' && profile.about.contato.visivelParaAmigos ? \`<div class=\\\\\\\"row gap-2\\\\\\\" style=\\\\\\\"margin-top:6px\\\\\\\"><i data-lucide=\\\\\\\"mail\\\\\\\"></i><a class=\\\\\\\"text-sm\\\\\\\" href=\\\\\\\"mailto:\${escapeHtml(profile.about.contato.email)}\\\\\\\">\${escapeHtml(profile.about.contato.email)}</a></div>\`:''}
            </div>
          </div>
        \`;
      } else {
        content += \`
          <div class=\\\"card\\\"><div class=\\\"card-c\\\">
            <div class=\\\"state-banner\\\">
              <i data-lucide=\\\"lock\\\"></i>
              <div>
                <div class=\\\"bold\\\">Este perfil é privado</div>
                <div class=\\\"text-sm muted\\\">Envie uma solicitação de amizade para ver as publicações e detalhes.</div>
              </div>
            </div>
          </div></div>
        \`;
      }

      // Composição final (2/3 + 1/3)
      if (canSeeContent) {
        main.innerHTML = hero + \`<div class=\\\"profile-split\\\"><div>\${content}</div><div>\${sideStack}</div></div>\`;
      } else {
        main.innerHTML = hero + content;
      }

      if(window.lucide) lucide.createIcons();
      bindActionEvents();
    }

    function renderActions(profile, canMessage){
      const items = [];
      if(relationshipState === 'friend'){
        items.push(\`<button class=\\\"btn\\\" data-action=\\\"message\\\" \${canMessage?'':'disabled'}><i data-lucide=\\\"message-circle\\\"></i> Enviar mensagem</button>\`);
        items.push(\`<button class=\\\"btn btn-outline\\\" data-action=\\\"unfriend\\\"><i data-lucide=\\\"user-x\\\"></i> Desfazer amizade</button>\`);
        if(profile.features.follow){ items.push(\`<button class=\\\"btn btn-outline\\\" data-action=\\\"follow\\\">\${following? '<i data-lucide=\\\"user-minus\\\"></i> Deixar de seguir':'<i data-lucide=\\\"user-plus\\\"></i> Seguir'}</button>\`); }
      } else {
        if(relationshipState === 'not_friend_public' || relationshipState === 'not_friend_private'){
          if(pendingRequest){
            items.push(\`<button class=\\\"btn btn-outline\\\" data-action=\\\"cancel-request\\\"><i data-lucide=\\\"clock\\\"></i> Solicitação enviada</button>\`);
          } else {
            items.push(\`<button class=\\\"btn btn-primary\\\" data-action=\\\"add-friend\\\"><i data-lucide=\\\"user-plus\\\"></i> Adicionar amigo</button>\`);
          }
          items.push(\`<button class=\\\"btn\\\" data-action=\\\"message\\\" \${canMessage?'' : 'disabled'}><i data-lucide=\\\"message-circle\\\"></i> Enviar mensagem</button>\`);
          if(profile.features.follow){ items.push(\`<button class=\\\"btn btn-outline\\\" data-action=\\\"follow\\\">\${following? '<i data-lucide=\\\"user-minus\\\"></i> Deixar de seguir':'<i data-lucide=\\\"user-plus\\\"></i> Seguir'}</button>\`); }
        }
      }
      return items.join('\\n');
    }

    function bindActionEvents(){
      document.querySelectorAll('[data-action]')?.forEach(el=>{
        el.addEventListener('click', ()=>{
          const act = el.getAttribute('data-action');
          if(act==='add-friend'){ pendingRequest = true; relationshipState = (relationshipState==='not_friend_private' || relationshipState==='not_friend_public') ? relationshipState : 'not_friend_public'; render(); alert('Solicitação de amizade enviada.'); }
          else if(act==='cancel-request'){ pendingRequest = false; render(); }
          else if(act==='unfriend'){ if(confirm('Remover dos amigos?')){ relationshipState = 'not_friend_public'; pendingRequest=false; render(); } }
          else if(act==='message'){ if(el.hasAttribute('disabled')) return; alert('Abrir chat (mock)'); }
          else if(act==='follow'){ following = !following; render(); }
          else if(act==='join-room'){ alert('Entrando na sala… (mock)'); }
          else if(act==='reopen-room'){ alert('Reabrindo sala… (mock)'); }
          else if(act==='open-community'){ alert('Abrir comunidade… (mock)'); }
          else if(act==='view-friend'){ const id = el.getAttribute('data-id'); const f = FRIENDS.find(x=>x.id===id); alert('Abrir perfil de ' + (f? f.name : 'amigo')); }
          else if(act==='friends-all'){ alert('Abrir lista completa de amigos… (mock)'); }
        });
      });
    }

    // Eventos UI gerais
    document.getElementById('themeToggle').addEventListener('click', ()=> Theme.toggle());
    document.getElementById('userToggle').addEventListener('click', ()=>{
      const sub = document.getElementById('userSub');
      const chev = document.querySelector('.user-chevron');
      const open = sub.style.display!==''; sub.style.display = open? '' : 'none';
      chev.style.transform = open? 'rotate(0deg)' : 'rotate(180deg)';
    });

    const scenario = document.getElementById('scenario');
    scenario.addEventListener('change', ()=>{
      relationshipState = scenario.value;
      pendingRequest = false; // reset
      render();
    });

    // Inicialização
    function init(){
      relationshipState = scenario.value;
      render();
    }
    init();
  </script>
</body>
</html>
        `
      }}
    />
  );
}