import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PenLine, HelpCircle, BarChart2, PencilRuler, Image, Paperclip, AtSign, Hash, Plus, Trash2, GripVertical } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePostCreation } from '../PostComposer/hooks/usePostCreation';
import { escapeHTML } from './utils';
import './styles.css';

type PostType = 'texto' | 'duvida' | 'enquete' | 'exercicio';

interface PostComposerV2Props {
  onPostCreated?: (post: any) => void;
  className?: string;
  initiallyOpen?: boolean;
}

interface PollOption {
  id: string;
  text: string;
}

interface ExerciseOption {
  id: string;
  letter: string;
  text: string;
  isCorrect: boolean;
}

export const PostComposerV2: React.FC<PostComposerV2Props> = ({
  onPostCreated,
  className = '',
  initiallyOpen = true,
}) => {
  const { user } = useAuth();
  const { createPost, isLoading } = usePostCreation();
  
  // Estado principal
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [currentType, setCurrentType] = useState<PostType>('duvida');
  
  // Estados dos formulários
  const [textoContent, setTextoContent] = useState('');
  const [duvidaTitle, setDuvidaTitle] = useState('');
  const [duvidaDesc, setDuvidaDesc] = useState('');
  const [duvidaTags, setDuvidaTags] = useState('');
  const [duvidaCategory, setDuvidaCategory] = useState('outros');
  const [duvidaDifficulty, setDuvidaDifficulty] = useState('intermediario');
  const [duvidaAnon, setDuvidaAnon] = useState(false);
  
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<PollOption[]>([
    { id: '1', text: '' },
    { id: '2', text: '' }
  ]);
  const [pollMulti, setPollMulti] = useState(false);
  const [pollDuration, setPollDuration] = useState('7');
  
  const [exStatement, setExStatement] = useState('');
  const [exMode, setExMode] = useState<'me' | 'dis'>('me');
  const [exDiff, setExDiff] = useState('intermediario');
  const [exTopic, setExTopic] = useState('');
  const [exOptions, setExOptions] = useState<ExerciseOption[]>([
    { id: '1', letter: 'A', text: '', isCorrect: true },
    { id: '2', letter: 'B', text: '', isCorrect: false },
    { id: '3', letter: 'C', text: '', isCorrect: false },
    { id: '4', letter: 'D', text: '', isCorrect: false }
  ]);
  const [exAnswer, setExAnswer] = useState('');

  // Refs para elementos
  const composerBodyRef = useRef<HTMLDivElement>(null);

  // Toggle abrir/fechar
  const handleToggle = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  // Trocar tipo de post
  const handleTypeChange = useCallback((type: PostType) => {
    setCurrentType(type);
  }, []);

  // Validação por tipo
  const isValid = useCallback(() => {
    switch (currentType) {
      case 'texto':
        return textoContent.trim().length > 0;
      case 'duvida':
        return duvidaTitle.trim().length > 0 && duvidaDesc.trim().length > 0;
      case 'enquete':
        const filledOptions = pollOptions.filter(opt => opt.text.trim().length > 0 && opt.text.trim().length <= 100);
        return pollQuestion.trim().length >= 5 && pollQuestion.trim().length <= 255 && filledOptions.length >= 2 && filledOptions.length <= 8;
      case 'exercicio':
        if (exMode === 'me') {
          const filledOptions = exOptions.filter(opt => opt.text.trim().length > 0 && opt.text.trim().length <= 255);
          const hasCorrect = exOptions.some(opt => opt.isCorrect && opt.text.trim().length > 0);
          return exStatement.trim().length >= 1 && exStatement.trim().length <= 10000 && filledOptions.length >= 2 && hasCorrect;
        } else {
          return exStatement.trim().length >= 1 && exStatement.trim().length <= 10000;
        }
      default:
        return false;
    }
  }, [currentType, textoContent, duvidaTitle, duvidaDesc, duvidaCategory, duvidaDifficulty, pollQuestion, pollOptions, exStatement, exMode, exOptions]);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!isValid() || isLoading) return;

    let postData: any = {};

    switch (currentType) {
      case 'texto':
        postData = {
          type: 'publicacao',
          title: null,
          content: textoContent,
          data: {},
          tags: [],
          isAnonymous: false
        };
        break;
      
      case 'duvida':
        postData = {
          type: 'duvida',
          title: duvidaTitle,
          content: duvidaDesc,
          data: {
            categoria_materia: duvidaCategory,
            nivel_dificuldade: duvidaDifficulty,
            contexto_academico: ''
          },
          tags: duvidaTags.split(',').map(t => t.trim()).filter(Boolean),
          isAnonymous: duvidaAnon
        };
        break;
      
      case 'enquete':
        const validOptions = pollOptions.filter(opt => opt.text.trim().length > 0);
        postData = {
          type: 'enquete',
          title: pollQuestion.trim(),
          content: pollQuestion.trim(),
          data: {
            poll_question: pollQuestion.trim(),
            poll_options: validOptions.map(opt => opt.text.trim()).filter(text => text.length > 0 && text.length <= 100),
            poll_multi: pollMulti,
            poll_duration: Number(pollDuration) || 7
          },
          tags: [],
          isAnonymous: false
        };
        break;
      
      case 'exercicio':
        if (exMode === 'me') {
          const validOptions = exOptions.filter(opt => opt.text.trim().length > 0);
          postData = {
            type: 'exercicio',
            title: exTopic ? `Exercício: ${exTopic}` : `Exercício de ${exDiff}`,
            content: exStatement,
            data: {
              categoria_materia: exTopic || 'outros',
              nivel_dificuldade: exDiff,
              tipo_exercicio: 'pratica',
              alternativas: validOptions.map(opt => ({
                letra: opt.letter,
                texto: opt.text,
                correta: opt.isCorrect
              }))
            },
            tags: exTopic ? [exTopic] : [],
            isAnonymous: false
          };
        } else {
          postData = {
            type: 'exercicio',
            title: exTopic ? `Exercício: ${exTopic}` : `Exercício de ${exDiff}`,
            content: exStatement,
            data: {
              categoria_materia: exTopic || 'outros',
              nivel_dificuldade: exDiff,
              tipo_exercicio: 'teoria',
              resolucao_comentada: exAnswer
            },
            tags: exTopic ? [exTopic] : [],
            isAnonymous: false
          };
        }
        break;
    }

    const success = await createPost(postData);
    if (success) {
      // Reset form
      resetForm();
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Callback
      onPostCreated?.(postData);
    }
  }, [currentType, isValid, isLoading, createPost, onPostCreated, textoContent, duvidaTitle, duvidaDesc, duvidaTags, duvidaCategory, duvidaDifficulty, duvidaAnon, pollQuestion, pollOptions, pollMulti, pollDuration, exStatement, exMode, exDiff, exTopic, exOptions, exAnswer]);

  // Reset
  const resetForm = useCallback(() => {
    setTextoContent('');
    setDuvidaTitle('');
    setDuvidaDesc('');
    setDuvidaTags('');
    setDuvidaCategory('outros');
    setDuvidaDifficulty('intermediario');
    setDuvidaAnon(false);
    setPollQuestion('');
    setPollOptions([{ id: '1', text: '' }, { id: '2', text: '' }]);
    setPollMulti(false);
    setPollDuration('7');
    setExStatement('');
    setExMode('me');
    setExDiff('intermediario');
    setExTopic('');
    setExOptions([
      { id: '1', letter: 'A', text: '', isCorrect: true },
      { id: '2', letter: 'B', text: '', isCorrect: false },
      { id: '3', letter: 'C', text: '', isCorrect: false },
      { id: '4', letter: 'D', text: '', isCorrect: false }
    ]);
    setExAnswer('');
    setCurrentType('duvida');
  }, []);

  const handleCancel = useCallback(() => {
    resetForm();
    setIsOpen(false);
  }, [resetForm]);

  // Poll options handlers
  const addPollOption = useCallback(() => {
    if (pollOptions.length >= 8) return;
    setPollOptions(prev => [...prev, { id: Date.now().toString(), text: '' }]);
  }, [pollOptions.length]);

  const removePollOption = useCallback((id: string) => {
    setPollOptions(prev => prev.filter(opt => opt.id !== id));
  }, []);

  const updatePollOption = useCallback((id: string, text: string) => {
    setPollOptions(prev => prev.map(opt => opt.id === id ? { ...opt, text } : opt));
  }, []);

  // Exercise options handlers
  const addExOption = useCallback(() => {
    if (exOptions.length >= 6) return;
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = letters[exOptions.length];
    setExOptions(prev => [...prev, { 
      id: Date.now().toString(), 
      letter, 
      text: '', 
      isCorrect: false 
    }]);
  }, [exOptions.length]);

  const removeExOption = useCallback((id: string) => {
    setExOptions(prev => {
      const filtered = prev.filter(opt => opt.id !== id);
      // Reletter
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      return filtered.map((opt, idx) => ({ ...opt, letter: letters[idx] }));
    });
  }, []);

  const updateExOption = useCallback((id: string, text: string) => {
    setExOptions(prev => prev.map(opt => opt.id === id ? { ...opt, text } : opt));
  }, []);

  const setExCorrect = useCallback((id: string) => {
    setExOptions(prev => prev.map(opt => ({ ...opt, isCorrect: opt.id === id })));
  }, []);

  // Main button handler
  const handleMainAction = useCallback(() => {
    if (!isOpen) {
      setIsOpen(true);
    } else if (isValid()) {
      handleSubmit();
    }
  }, [isOpen, isValid, handleSubmit]);

  if (!user) return null;

  return (
    <div className={`composer-card ${className}`}>
      {/* Header */}
      <div className="composer-header" onClick={!isOpen ? handleToggle : undefined}>
        <PencilRuler className="h-5 w-5" />
        <div className="composer-title">Criar postagem</div>
        <div className="flex-1" />
        <button 
          className="btn btn-primary" 
          onClick={handleMainAction}
          disabled={isLoading}
          type="button"
        >
          {isLoading ? 'Criando...' : (!isOpen ? 'Novo tópico' : 'Adicionar')}
        </button>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="composer-body" ref={composerBodyRef}>
          {/* Type Switch */}
          <div className="type-switch" role="tablist" aria-label="Tipo de postagem">
            <div 
              className={`chip ${currentType === 'texto' ? 'active' : ''}`}
              onClick={() => handleTypeChange('texto')}
              role="tab"
              aria-selected={currentType === 'texto'}
              aria-controls="form-texto"
            >
              <PenLine className="h-4 w-4" />
              <span>Publicação</span>
            </div>
            <div 
              className={`chip ${currentType === 'duvida' ? 'active' : ''}`}
              onClick={() => handleTypeChange('duvida')}
              role="tab"
              aria-selected={currentType === 'duvida'}
              aria-controls="form-duvida"
            >
              <HelpCircle className="h-4 w-4" />
              <span>Dúvida</span>
            </div>
            <div 
              className={`chip ${currentType === 'enquete' ? 'active' : ''}`}
              onClick={() => handleTypeChange('enquete')}
              role="tab"
              aria-selected={currentType === 'enquete'}
              aria-controls="form-enquete"
            >
              <BarChart2 className="h-4 w-4" />
              <span>Enquete</span>
            </div>
            <div 
              className={`chip ${currentType === 'exercicio' ? 'active' : ''}`}
              onClick={() => handleTypeChange('exercicio')}
              role="tab"
              aria-selected={currentType === 'exercicio'}
              aria-controls="form-exercicio"
            >
              <PencilRuler className="h-4 w-4" />
              <span>Exercício</span>
            </div>
          </div>

          {/* Forms */}
          {currentType === 'texto' && (
            <form className="form-content" id="form-texto">
              <div className="texto-input-row">
                <div className="avatar">V</div>
                <textarea
                  value={textoContent}
                  onChange={(e) => setTextoContent(e.target.value)}
                  placeholder="O que você está pensando?"
                  maxLength={500}
                  className="texto-textarea"
                />
              </div>
              <div className="texto-tools">
                <button type="button" className="btn-icon" title="Adicionar imagem">
                  <Image className="h-4 w-4" />
                </button>
                <button type="button" className="btn-icon" title="Anexar arquivo">
                  <Paperclip className="h-4 w-4" />
                </button>
                <button type="button" className="btn-icon" title="Mencionar alguém">
                  <AtSign className="h-4 w-4" />
                </button>
                <button type="button" className="btn-icon" title="Adicionar hashtag">
                  <Hash className="h-4 w-4" />
                </button>
                <div className="flex-1" />
                <div className="char-counter">
                  <span>{textoContent.length}</span>/500
                </div>
              </div>
            </form>
          )}

          {currentType === 'duvida' && (
            <form className="form-content" id="form-duvida">
              <div className="field">
                <label htmlFor="duvida-title">Título da dúvida</label>
                <input
                  id="duvida-title"
                  type="text"
                  value={duvidaTitle}
                  onChange={(e) => setDuvidaTitle(e.target.value)}
                  placeholder="Ex.: Como memorizar os princípios constitucionais?"
                  className="input"
                />
              </div>
              <div className="field">
                <label htmlFor="duvida-desc">Descrição</label>
                <textarea
                  id="duvida-desc"
                  value={duvidaDesc}
                  onChange={(e) => setDuvidaDesc(e.target.value)}
                  placeholder="Explique sua dúvida com detalhes…"
                  className="input"
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="duvida-category">Categoria</label>
                  <select
                    id="duvida-category"
                    value={duvidaCategory}
                    onChange={(e) => setDuvidaCategory(e.target.value)}
                    className="input"
                  >
                    <option value="matematica">Matemática</option>
                    <option value="fisica">Física</option>
                    <option value="quimica">Química</option>
                    <option value="biologia">Biologia</option>
                    <option value="historia">História</option>
                    <option value="geografia">Geografia</option>
                    <option value="portugues">Português</option>
                    <option value="literatura">Literatura</option>
                    <option value="filosofia">Filosofia</option>
                    <option value="sociologia">Sociologia</option>
                    <option value="ingles">Inglês</option>
                    <option value="espanhol">Espanhol</option>
                    <option value="programacao">Programação</option>
                    <option value="engenharia">Engenharia</option>
                    <option value="medicina">Medicina</option>
                    <option value="direito">Direito</option>
                    <option value="administracao">Administração</option>
                    <option value="economia">Economia</option>
                    <option value="psicologia">Psicologia</option>
                    <option value="artes">Artes</option>
                    <option value="musica">Música</option>
                    <option value="educacao_fisica">Educação Física</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="duvida-difficulty">Dificuldade</label>
                  <select
                    id="duvida-difficulty"
                    value={duvidaDifficulty}
                    onChange={(e) => setDuvidaDifficulty(e.target.value)}
                    className="input"
                  >
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                    <option value="especialista">Especialista</option>
                  </select>
                </div>
              </div>
              <div className="field-row">
                <div className="field flex-1">
                  <label htmlFor="duvida-tags">Tags (separadas por vírgula)</label>
                  <input
                    id="duvida-tags"
                    type="text"
                    value={duvidaTags}
                    onChange={(e) => setDuvidaTags(e.target.value)}
                    placeholder="Direito, CF/88, princípios"
                    className="input"
                  />
                </div>
                <div className="field-anon">
                  <label className="chip">
                    <input
                      type="checkbox"
                      checked={duvidaAnon}
                      onChange={(e) => setDuvidaAnon(e.target.checked)}
                    />
                    Publicar como anônimo
                  </label>
                </div>
              </div>
              <div className="hint">Dica: títulos claros atraem respostas melhores.</div>
            </form>
          )}

          {currentType === 'enquete' && (
            <form className="form-content" id="form-enquete">
              <div className="field">
                <label htmlFor="poll-question">Pergunta da enquete</label>
                <input
                  id="poll-question"
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="Ex.: Qual matéria você quer revisar hoje?"
                  className="input"
                />
              </div>
              <div className="field">
                <label>Opções</label>
                <div className="poll-options">
                  {pollOptions.map((option, index) => (
                    <div key={option.id} className="option-item">
                      <div className="drag">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updatePollOption(option.id, e.target.value)}
                        placeholder="Digite uma opção"
                        className="input flex-1"
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removePollOption(option.id)}
                          className="btn-icon"
                          title="Remover"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="poll-controls">
                  <button
                    type="button"
                    onClick={addPollOption}
                    className="btn btn-outline"
                    disabled={pollOptions.length >= 8}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar opção
                  </button>
                  <label className="chip">
                    <input
                      type="checkbox"
                      checked={pollMulti}
                      onChange={(e) => setPollMulti(e.target.checked)}
                    />
                    Permitir múltiplas escolhas
                  </label>
                  <div className="poll-duration">
                    <label htmlFor="poll-duration">Duração</label>
                    <select
                      id="poll-duration"
                      value={pollDuration}
                      onChange={(e) => setPollDuration(e.target.value)}
                      className="input"
                    >
                      <option value="1">1 dia</option>
                      <option value="3">3 dias</option>
                      <option value="7">7 dias</option>
                      <option value="14">14 dias</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="hint">Mantenha as opções curtas e mutuamente exclusivas.</div>
            </form>
          )}

          {currentType === 'exercicio' && (
            <form className="form-content" id="form-exercicio">
              <div className="field">
                <label htmlFor="ex-statement">Enunciado do exercício</label>
                <textarea
                  id="ex-statement"
                  value={exStatement}
                  onChange={(e) => setExStatement(e.target.value)}
                  placeholder="Descreva o enunciado…"
                  className="input"
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label htmlFor="ex-mode">Modalidade</label>
                  <select
                    id="ex-mode"
                    value={exMode}
                    onChange={(e) => setExMode(e.target.value as 'me' | 'dis')}
                    className="input"
                  >
                    <option value="me">Múltipla escolha</option>
                    <option value="dis">Dissertativa</option>
                  </select>
                </div>
                <div className="field">
                  <label htmlFor="ex-diff">Dificuldade</label>
                  <select
                    id="ex-diff"
                    value={exDiff}
                    onChange={(e) => setExDiff(e.target.value)}
                    className="input"
                  >
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                    <option value="especialista">Especialista</option>
                  </select>
                </div>
                <div className="field flex-1">
                  <label htmlFor="ex-topic">Assunto (opcional)</label>
                  <input
                    id="ex-topic"
                    type="text"
                    value={exTopic}
                    onChange={(e) => setExTopic(e.target.value)}
                    placeholder="Ex.: Princípios Constitucionais"
                    className="input"
                  />
                </div>
              </div>

              {exMode === 'me' && (
                <div className="field">
                  <label>Alternativas</label>
                  <div className="ex-options">
                    {exOptions.map((option) => (
                      <div key={option.id} className="option-item">
                        <div className="option-letter">{option.letter}</div>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateExOption(option.id, e.target.value)}
                          placeholder={`Alternativa ${option.letter}`}
                          className="input flex-1"
                        />
                        <label className="chip">
                          <input
                            type="radio"
                            name="ex-correct"
                            checked={option.isCorrect}
                            onChange={() => setExCorrect(option.id)}
                          />
                          Correta
                        </label>
                        {exOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeExOption(option.id)}
                            className="btn-icon"
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="ex-controls">
                    <button
                      type="button"
                      onClick={addExOption}
                      className="btn btn-outline"
                      disabled={exOptions.length >= 6}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar alternativa
                    </button>
                    <div className="hint">Marque a alternativa correta.</div>
                  </div>
                </div>
              )}

              {exMode === 'dis' && (
                <div className="field">
                  <label htmlFor="ex-answer">Gabarito / Diretriz de correção (opcional)</label>
                  <textarea
                    id="ex-answer"
                    value={exAnswer}
                    onChange={(e) => setExAnswer(e.target.value)}
                    placeholder="Esboce os pontos esperados na resposta…"
                    className="input"
                  />
                </div>
              )}
            </form>
          )}

          {/* Footer */}
          <div className="composer-footer">
            <div className="hint">
              Selecione o tipo e preencha os campos. Apenas um tipo aparece por vez.
            </div>
            <div className="footer-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-outline"
                disabled={isLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary"
                disabled={!isValid() || isLoading}
              >
                {isLoading ? 'Criando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};