# Funcionalidades do Projeto

Este documento descreve as principais funcionalidades do projeto, divididas por módulos, e os arquivos que as implementam.

## Autenticação

-   **Login de usuário**: Permite que usuários existentes acessem suas contas.
    -   `src/pages/Login.tsx`: Página de login da aplicação.
    -   `src/contexts/AuthContext.tsx`: Gerencia o estado de autenticação do usuário em toda a aplicação.
-   **Registro de usuário**: Permite que novos usuários criem uma conta.
    -   `src/pages/Register.tsx`: Página de registro de novos usuários.
-   **Recuperação de senha**: Funcionalidade para usuários que esqueceram sua senha.
    -   `src/pages/ForgotPassword.tsx`: Página para o usuário solicitar a recuperação de senha.
-   **Verificação de e-mail**: Garante que o e-mail fornecido pelo usuário é válido.
    -   `backend/src/controllers/authController.js`: Lida com a lógica de verificação de e-mail no backend.

## Feed de Atividades

-   **Criação de posts**: Usuários podem criar diferentes tipos de posts (publicação, dúvida, desafio, exercício).
    -   `src/components/Feed/PostForm.tsx`: Formulário para a criação de novos posts.
    -   `backend/src/routes/posts.js`: Define as rotas da API para criar, ler, atualizar e deletar posts.
-   **Visualização de posts**: O feed principal exibe os posts de amigos e comunidades.
    -   `src/pages/Feed.tsx`: Página principal que exibe o feed de atividades.
    -   `src/components/Feed/PostList.tsx`: Componente que renderiza a lista de posts.
-   **Interação com posts**: Usuários podem curtir, comentar e compartilhar posts.
    -   `src/components/Post/PostActions.tsx`: Contém os botões para curtir, comentar e compartilhar.
    -   `src/components/Post/CommentSection.tsx`: Exibe e permite a adição de comentários.
-   **Filtro de posts**: Possibilidade de filtrar os posts por tipo ou relevância.

## Amigos

-   **Adicionar amigos**: Usuários podem enviar e aceitar pedidos de amizade.
-   **Remover amigos**: Usuários podem remover amigos de sua lista.
-   **Listar amigos**: Visualização da lista de amigos.
    -   `src/pages/Friends.tsx`: Página para gerenciar amigos.
    -   `src/hooks/useConnections.tsx`: Hook para gerenciar a lógica de conexões (amizades).
    -   `backend/src/controllers/userController.js`: Contém a lógica do servidor para gerenciar amizades.
-   **Sugestão de amigos**: O sistema sugere novos amigos com base em interesses em comum.

## Chat

-   **Chat em tempo real**: Comunicação instantânea entre usuários.
    -   `src/pages/Chat.tsx`: Interface principal do chat.
    -   `src/components/Chat/ChatWindow.tsx`: Janela de conversa entre usuários.
    -   `src/contexts/ChatContext.tsx`: Gerencia o estado e a lógica do chat.
    -   `src/contexts/SocketContext.tsx`: Gerencia a conexão WebSocket para comunicação em tempo real.
    -   `backend/src/server.js`: Configuração do servidor Socket.io para o chat.
-   **Conversas em grupo**: Chats dentro das salas de estudo.
-   **Envio de arquivos e emojis**: Suporte para envio de mídias e reações.

## Salas de Estudo (Salas)

-   **Criação de salas**: Usuários podem criar salas de estudo públicas ou privadas.
    -   `src/components/Sala/CreateRoomModal.tsx`: Modal para criação de novas salas.
-   **Entrar em salas**: Usuários podem entrar em salas existentes.
    -   `src/pages/Sala.tsx`: Página para visualização e interação com uma sala de estudo.
-   **Gerenciamento de membros**: Donos de salas podem gerenciar os membros.
    -   `backend/src/routes/rooms.js`: Rotas da API para gerenciar as salas de estudo.
-   **Notificações de acesso**: Solicitações para entrar em salas privadas.

## Questões

-   **Criação de questões**: Usuários podem criar questões de múltipla escolha, dissertativas, etc.
    -   `src/components/Questions/QuestionForm.tsx`: Formulário para criação de novas questões.
-   **Banco de questões**: Um banco de questões que pode ser filtrado por matéria, tipo, etc.
-   **Resolução de questões**: Usuários podem responder questões e ver seu desempenho.
    -   `src/pages/Questions.tsx`: Página para buscar e responder questões.
    -   `src/hooks/useExercises.ts`: Hook para buscar e gerenciar a lógica dos exercícios.
-   **Estatísticas de questões**: Gráficos e estatísticas sobre o desempenho nas questões.
    -   `src/components/QuestionStats.tsx`: Componente para exibir estatísticas de desempenho.

## Aulas

-   **Criação de aulas**: Usuários podem criar aulas e associá-las a matérias.
    -   `src/components/NovaAulaModal.tsx`: Modal para criar uma nova aula.
-   **Gerenciamento de conteúdo**: Adição de arquivos (PDFs, vídeos) e anotações às aulas.
    -   `src/contexts/StudyAppContext.tsx`: Gerencia o estado relacionado ao módulo de aulas/estudo.
-   **Histórico de aulas**: Visualização do histórico de aulas assistidas.

## Flashcards

-   **Criação de flashcards**: Ferramenta para criar e gerenciar flashcards de estudo.
    -   `src/components/StudyApp/CreateFlashcardSet.tsx`: Componente para criar um novo conjunto de flashcards.
-   **Revisão de flashcards**: Sistema de revisão espaçada para os flashcards.
    -   `src/components/StudyApp/FlashcardMode.tsx`: Componente para o modo de estudo com flashcards.

## Calendário

-   **Agendamento de sessões de estudo**: Usuários podem agendar suas sessões de estudo.
-   **Visualização de eventos**: O calendário exibe os eventos e sessões agendadas.
    -   `src/pages/CalendarPage.tsx`: Página que exibe o calendário de estudos.
    -   `src/components/Calendar/Calendar.tsx`: Componente principal do calendário.
-   **Integração com outras funcionalidades**: O calendário pode ser integrado com as aulas e salas de estudo.

## Gamificação

-   **Streaks de estudo**: Sistema de contagem de dias seguidos de estudo.
    -   `src/components/Gamification/Streaks.tsx`: Exibe os streaks de estudo do usuário.
-   **Pontuação e ranking**: Usuários ganham pontos por atividades e podem competir em um ranking.
    -   `src/components/Gamification/Ranking.tsx`: Exibe o ranking de usuários.
-   **Conquistas**: Medalhas e outras recompensas por atingir metas.
    -   `src/contexts/GamificationContext.tsx`: Gerencia o estado e a lógica de gamificação.

## Notificações

-   **Notificações no aplicativo**: Alertas sobre novas mensagens, pedidos de amizade, etc.
-   **Centro de notificações**: Uma área para visualizar todas as notificações.
    -   `src/components/Notifications/NotificationCenter.tsx`: Componente que exibe a lista de notificações.
    -   `backend/src/routes/notifications.js`: Rotas da API para gerenciar notificações.

## Perfil de Usuário

-   **Visualização de perfil**: Exibe informações do usuário, como nome, foto e biografia.
    -   `src/pages/Profile.tsx`: Página de perfil do usuário.
    -   `src/components/Profile/ProfileHeader.tsx`: Cabeçalho do perfil com informações do usuário.
-   **Log de atividades**: Histórico de atividades do usuário na plataforma.
    -   `src/components/Profile/ActivityLog.tsx`: Exibe o log de atividades do usuário.
-   **Configurações de privacidade**: Opções para controlar a visibilidade do perfil e das atividades.

## Comunidades

-   **Criação de comunidades**: Usuários podem criar comunidades sobre temas específicos.
    -   `src/components/Community/CreateCommunityModal.tsx`: Modal para criação de novas comunidades.
-   **Tópicos (Threads)**: Discussões dentro das comunidades.
-   **Moderação de comunidades**: Ferramentas para moderar o conteúdo e os membros das comunidades.
    -   `src/pages/Community.tsx`: Página de uma comunidade específica.
    -   `backend/src/routes/communities.js`: Rotas da API para gerenciar as comunidades.