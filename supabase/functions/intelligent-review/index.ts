import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewSession {
  action: 'start' | 'answer' | 'next' | 'analyze' | 'chat';
  content?: string;
  sessionId?: string;
  userAnswer?: string;
  questionIndex?: number;
  userMessage?: string;
  analysis?: unknown;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, content, sessionId, userAnswer, questionIndex, userMessage, analysis }: ReviewSession = await req.json();

    console.log('Action received:', action);

    switch (action) {
      case 'start': {
        if (!content) {
          throw new Error('Content is required to start review');
        }

        const prompt = `Você é um professor experiente analisando o seguinte conteúdo acadêmico:

${content}

Com base neste conteúdo, você deve:
1. Identificar os 3-5 conceitos mais importantes
2. Criar uma sequência de 5 perguntas progressivas (do básico ao avançado)
3. Para cada pergunta, fornecer dicas e explicações quando necessário

Responda APENAS em formato JSON válido:
{
  "concepts": ["conceito1", "conceito2", "conceito3"],
  "questions": [
    {
      "id": 1,
      "question": "pergunta aqui",
      "type": "multiple_choice",
      "options": ["A) opção1", "B) opção2", "C) opção3", "D) opção4"],
      "correct": 0,
      "difficulty": "facil",
      "hint": "dica para ajudar",
      "explanation": "explicação da resposta correta"
    }
  ]
}`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer sk-7330b0d6e6d748f9ac9630de6025f336`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'Você é um professor experiente que cria questões educativas. Responda sempre em JSON válido.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('DeepSeek API error:', data);
          throw new Error(`DeepSeek API error: ${data.error?.message || 'Unknown error'}`);
        }
        
        let aiResponse = data.choices[0].message.content;
        console.log('AI Response:', aiResponse);
        
        // Limpar markdown code blocks se presentes
        aiResponse = aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        console.log('Cleaned AI Response:', aiResponse);
        
        try {
          const sessionData = JSON.parse(aiResponse);
          const newSessionId = crypto.randomUUID();
          
          return new Response(JSON.stringify({
            sessionId: newSessionId,
            ...sessionData,
            currentQuestion: 0,
            score: 0,
            completed: false
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          console.error('Raw AI response:', aiResponse);
          throw new Error('Resposta da IA em formato inválido. Tente novamente.');
        }
      }

      case 'answer': {
        if (!userAnswer || questionIndex === undefined) {
          throw new Error('User answer and question index required');
        }

        const feedbackPrompt = `Como professor, analise esta resposta do aluno:

Pergunta: ${userAnswer}
Índice da questão: ${questionIndex}

Forneça feedback educativo em português. Seja encorajador mas preciso.
Se a resposta estiver incorreta, explique o conceito correto.
Se estiver correta, reforce o aprendizado.

Responda em JSON:
{
  "feedback": "seu feedback aqui",
  "isCorrect": true/false,
  "encouragement": "mensagem de encorajamento"
}`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${deepseekApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'Você é um professor que fornece feedback construtivo.' },
              { role: 'user', content: feedbackPrompt }
            ],
            temperature: 0.6,
            max_tokens: 500,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('DeepSeek API error:', data);
          throw new Error(`DeepSeek API error: ${data.error?.message || 'Unknown error'}`);
        }
        
        let aiResponse = data.choices[0].message.content;
        
        // Limpar markdown code blocks se presentes
        aiResponse = aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        
        const feedbackResponse = JSON.parse(aiResponse);
        
        return new Response(JSON.stringify(feedbackResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'analyze': {
        if (!content) {
          throw new Error('Content required for analysis');
        }

        const analysisPrompt = `Analise este conteúdo acadêmico como um professor experiente:

${content}

Forneça uma análise estruturada em JSON:
{
  "summary": "resumo dos pontos principais",
  "keyTopics": ["tópico1", "tópico2", "tópico3"],
  "difficulty": "fácil/médio/difícil",
  "studyTime": "tempo estimado em minutos",
  "prerequisites": ["pré-requisito1", "pré-requisito2"],
  "nextSteps": ["próximo passo1", "próximo passo2"]
}`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer sk-7330b0d6e6d748f9ac9630de6025f336`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'Você é um professor que analisa conteúdo acadêmico.' },
              { role: 'user', content: analysisPrompt }
            ],
            temperature: 0.5,
            max_tokens: 800,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('DeepSeek API error:', data);
          throw new Error(`DeepSeek API error: ${data.error?.message || 'Unknown error'}`);
        }
        
        let aiResponse = data.choices[0].message.content;
        
        // Limpar markdown code blocks se presentes
        aiResponse = aiResponse.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        
        const analysis = JSON.parse(aiResponse);
        
        return new Response(JSON.stringify(analysis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'chat': {
        if (!userMessage || !content) {
          throw new Error('User message and content required for chat');
        }

        const analysisContext = analysis ? `
        
Análise prévia do conteúdo:
- Resumo: ${analysis.summary}
- Tópicos: ${analysis.keyTopics?.join(', ')}
- Dificuldade: ${analysis.difficulty}
- Pré-requisitos: ${analysis.prerequisites?.join(', ')}` : '';

        const chatPrompt = `Você é uma professora experiente e amigável que está ajudando um aluno a entender o seguinte conteúdo:

${content}
${analysisContext}

O aluno fez a seguinte pergunta ou comentário:
"${userMessage}"

Como uma professora atenciosa:
1. Responda de forma clara e didática
2. Use exemplos práticos quando apropriado
3. Seja encorajadora e motivadora
4. Se apropriado, faça perguntas de volta para verificar o entendimento
5. Adapte sua linguagem ao nível de dificuldade do conteúdo
6. Se o aluno pedir exercícios, crie alguns relacionados ao conteúdo

Responda de forma conversacional, como se estivesse realmente conversando com o aluno.`;

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${deepseekApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: 'Você é uma professora experiente, amigável e didática que adora ensinar e ajudar alunos.' },
              { role: 'user', content: chatPrompt }
            ],
            temperature: 0.7,
            max_tokens: 800,
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          console.error('DeepSeek API error:', data);
          throw new Error(`DeepSeek API error: ${data.error?.message || 'Unknown error'}`);
        }
        
        const aiResponse = data.choices[0].message.content;
        
        return new Response(JSON.stringify({ response: aiResponse }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in intelligent-review function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});