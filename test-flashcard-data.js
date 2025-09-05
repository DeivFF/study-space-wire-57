// Script para adicionar dados de teste ao localStorage
// Execute no console do navegador para testar a migração

const testCards = [
  {
    id: "test-1",
    tipo: "conceito",
    pergunta: "O que é React?",
    resposta: "Uma biblioteca JavaScript para construir interfaces de usuário",
    tags: ["react", "frontend", "javascript"],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "test-2", 
    tipo: "definição",
    pergunta: "Defina useState hook",
    respostaCurta: "Hook para gerenciar estado em componentes funcionais",
    respostaAprofundada: "useState é um Hook que permite adicionar estado a componentes funcionais. Retorna um array com o valor atual do estado e uma função para atualizá-lo.",
    dica: "Sempre use função para updates baseados no estado anterior",
    referencia: "Documentação oficial do React",
    tags: ["react", "hooks", "state"],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: "test-3",
    tipo: "caso",
    pergunta: "Como implementar um contador com useState?",
    resposta: "const [count, setCount] = useState(0); <button onClick={() => setCount(count + 1)}>+</button>",
    tags: ["react", "exemplo", "contador"],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

// Salvar no localStorage
localStorage.setItem('flashcards-bank-v1', JSON.stringify(testCards));
console.log('✅ Dados de teste salvos no localStorage');
console.log('📋 Cards criados:', testCards.length);
console.log('🔄 Recarregue a página e acesse a aba Flashcards para ver a migração');