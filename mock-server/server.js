
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Dados mockados
const mockData = {
  lessons: [
    {
      id: 'a1',
      title: 'Introdução à Álgebra',
      difficulty: 'medio',
      status: 'em_andamento',
      accuracy: 72,
      resources: [
        { id: 'r1', type: 'pdf', name: 'Apostila Álgebra.pdf', size: '3.2 MB', studied: true, primary: true },
        { id: 'r2', type: 'audio', name: 'Áudio Aula 1.m4a', duration: '12:40' },
        { id: 'r3', type: 'html', name: 'Resumo interativo' }
      ],
      notes: 'Revisar propriedades distributivas.',
      flashcards: 40,
      flashcardsDue: 10,
      progress: 55,
      updatedAt: new Date().toISOString(),
      categoryId: 'cat-matematica'
    },
    {
      id: 'a2',
      title: 'Funções e Gráficos',
      difficulty: 'dificil',
      status: 'nao_iniciado',
      accuracy: 0,
      resources: [
        { id: 'r4', type: 'pdf', name: 'Funções.pdf', size: '1.1 MB' },
        { id: 'r5', type: 'site', name: 'Playlist YouTube' }
      ],
      notes: '',
      flashcards: 12,
      flashcardsDue: 12,
      progress: 5,
      updatedAt: new Date().toISOString(),
      categoryId: 'cat-matematica'
    },
    {
      id: 'a3',
      title: 'Interpretação de Texto',
      difficulty: 'facil',
      status: 'estudado',
      accuracy: 88,
      resources: [
        { id: 'r6', type: 'pdf', name: 'Interpretação.pdf', size: '2.0 MB', studied: true, primary: true }
      ],
      flashcards: 8,
      flashcardsDue: 0,
      progress: 100,
      updatedAt: new Date().toISOString(),
      categoryId: 'cat-portugues'
    }
  ],
  categories: [
    {
      id: 'cat-matematica',
      name: 'Matemática',
      createdAt: new Date().toISOString()
    },
    {
      id: 'cat-portugues',
      name: 'Português',
      createdAt: new Date().toISOString()
    }
  ],
  profiles: [
    {
      id: '418ef64a-7558-4e0b-b8c0-b9a2fd938869',
      user_id: '418ef64a-7558-4e0b-b8c0-b9a2fd938869',
      nickname: 'Usuario',
      status: 'online',
      last_activity: new Date().toISOString()
    }
  ]
};

// Rotas
app.get('/api/lessons/categories', (req, res) => {
  res.json(mockData.categories);
});

app.get('/api/lessons', (req, res) => {
  const { category_id } = req.query;
  let lessons = mockData.lessons;
  
  if (category_id) {
    lessons = lessons.filter(lesson => lesson.categoryId === category_id);
  }
  
  res.json(lessons);
});

app.get('/api/profiles', (req, res) => {
  const { user_id__eq } = req.query;
  let profiles = mockData.profiles;
  
  if (user_id__eq) {
    profiles = profiles.filter(profile => profile.user_id === user_id__eq);
  }
  
  res.json(profiles);
});

app.put('/api/profiles', (req, res) => {
  const { user_id, ...updateData } = req.body;
  
  const profileIndex = mockData.profiles.findIndex(p => p.user_id === user_id);
  
  if (profileIndex !== -1) {
    mockData.profiles[profileIndex] = { ...mockData.profiles[profileIndex], ...updateData };
    res.json(mockData.profiles[profileIndex]);
  } else {
    const newProfile = { id: user_id, user_id, ...updateData };
    mockData.profiles.push(newProfile);
    res.json(newProfile);
  }
});

// Rotas genéricas para evitar 404
app.get('/api/*', (req, res) => {
  res.json([]);
});

app.post('/api/*', (req, res) => {
  res.json({ success: true });
});

app.put('/api/*', (req, res) => {
  res.json({ success: true });
});

app.delete('/api/*', (req, res) => {
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});
