'use client';

import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Heart, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  RefreshCw, 
  Send, 
  UploadCloud, 
  FileText, 
  GraduationCap, 
  ChevronRight, 
  MessageSquare,
  Award,
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEFAULT_QUESTIONS } from '../data/defaultQuestions';
import { Question } from '../types/quiz';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export default function RevisaoDaMalu() {
  const [activeTab, setActiveTab] = useState<'quiz' | 'tutor' | 'create'>('quiz');

  // Estado do Quiz
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS["Geral"]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Estado de upload de resumos / criação de quiz
  const [subjectTitle, setSubjectTitle] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Estado do Tutor IA
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content: 'Olá, Malu! 💙 Sou seu tutor de Psicologia. Pode me mandar qualquer dúvida teórica, pedir para explicar conceitos (como mecanismos de defesa, TCC, behaviorismo, etc.), ou pedir referências bibliográficas para suas provas. Como posso te ajudar hoje?'
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Tratamento da resposta no Quiz
  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleConfirmAnswer = () => {
    if (selectedOption === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    const currentQ = questions[currentIdx];
    if (selectedOption === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsFinished(true);
      if (score + (selectedOption === questions[currentIdx].correctAnswer ? 1 : 0) >= questions.length * 0.7) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const restartQuiz = () => {
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsFinished(false);
  };

  // Carregar arquivo de resumo (.txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setSummaryText(content);
      }
    };
    reader.readAsText(file);
  };

  // Gerar novo Quiz com IA
  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectTitle.trim() && !summaryText.trim()) {
      setGenError('Por favor, informe a matéria ou cole o resumo das aulas.');
      return;
    }
    setIsGenerating(true);
    setGenError(null);

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: subjectTitle,
          summary: summaryText,
          count: questionCount
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar quiz');
      }

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIdx(0);
        setSelectedOption(null);
        setIsAnswerSubmitted(false);
        setScore(0);
        setIsFinished(false);
        setActiveTab('quiz');
      } else {
        throw new Error('Nenhuma questão foi retornada. Tente novamente.');
      }
    } catch (err: any) {
      setGenError(err.message || 'Erro inesperado. Verifique se a GEMINI_API_KEY está configurada.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Perguntar ao Tutor de IA
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputQuestion;
    if (!textToSend.trim() || isChatLoading) return;

    const newMsgs: ChatMsg[] = [...chatMessages, { role: 'user', content: textToSend }];
    setChatMessages(newMsgs);
    if (!customPrompt) setInputQuestion('');
    setIsChatLoading(true);

    try {
      const currentQ = questions[currentIdx];
      const contextText = currentQ ? `Questão em foco no momento: "${currentQ.question}" (Tema: ${currentQ.psychologySource || 'Geral'})` : '';

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMsgs,
          context: `${summaryText ? `Resumo estudado: ${summaryText.slice(0, 500)}... ` : ''}${contextText}`
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha na resposta do assistente');

      setChatMessages([...newMsgs, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setChatMessages([
        ...newMsgs,
        { role: 'assistant', content: `Ops! Tive um problema: ${err.message}. Verifique a chave da API do Gemini.` }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Enviar a dúvida de uma questão diretamente para o Tutor
  const askTutorAboutCurrentQuestion = () => {
    const q = questions[currentIdx];
    const userChoice = selectedOption !== null ? q.options[selectedOption] : 'nenhuma';
    const prompt = `Pode me explicar detalhadamente por que acertei/errei esta questão de psicologia?\n\nPergunta: "${q.question}"\nMinha escolha: "${userChoice}"\nAlternativa correta: "${q.options[q.correctAnswer]}"\n\nPoderia me citar a fundamentação bibliográfica e autores para eu revisar para a prova?`;
    setActiveTab('tutor');
    setTimeout(() => {
      handleSendMessage(prompt);
    }, 100);
  };

  const currentQ = questions[currentIdx];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-blue-50/40 to-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-800">Revisão da Malu</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Psicologia
                </span>
              </div>
              <p className="text-xs text-blue-600/90 font-medium flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                Feito com amor para minha futura psicóloga. Ass: Paulo
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'quiz'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Quiz de Fixação
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              Anexar Resumo
            </button>
            <button
              onClick={() => setActiveTab('tutor')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'tutor'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Tutor IA & Dúvidas
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* TAB 1: QUIZ */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            {!isFinished && currentQ ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-blue-100/80 relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-100/60 rounded-full blur-3xl pointer-events-none" />

                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  <span>Questão {currentIdx + 1} de {questions.length}</span>
                  <span className="text-blue-600">Pontuação: {score}</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-6">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>

                {/* Question Title */}
                <h2 className="text-lg sm:text-xl font-semibold text-slate-900 leading-snug mb-6">
                  {currentQ.question}
                </h2>

                {/* Options List */}
                <div className="space-y-3 mb-6">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQ.correctAnswer;
                    
                    let btnStyle = "border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700 bg-white";
                    
                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        btnStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-medium shadow-sm";
                      } else if (isSelected && !isCorrect) {
                        btnStyle = "border-rose-400 bg-rose-50 text-rose-900";
                      } else {
                        btnStyle = "border-slate-200 opacity-60 text-slate-500";
                      }
                    } else if (isSelected) {
                      btnStyle = "border-blue-500 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswerSubmitted}
                        className={`w-full p-4 text-left rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer disabled:cursor-default ${btnStyle}`}
                      >
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isAnswerSubmitted && isCorrect
                            ? 'bg-emerald-600 text-white'
                            : isAnswerSubmitted && isSelected && !isCorrect
                            ? 'bg-rose-500 text-white'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm sm:text-base pt-0.5 leading-relaxed">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div>
                    {isAnswerSubmitted && (
                      <button
                        onClick={askTutorAboutCurrentQuestion}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        Tirar dúvida com a IA sobre esta questão
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {!isAnswerSubmitted ? (
                      <button
                        onClick={handleConfirmAnswer}
                        disabled={selectedOption === null}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20"
                      >
                        Confirmar Resposta
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                      >
                        {currentIdx + 1 < questions.length ? 'Próxima Questão' : 'Ver Resultado'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Explanation Box */}
                {isAnswerSubmitted && (
                  <div className={`mt-6 p-5 rounded-2xl border transition-all ${
                    selectedOption === currentQ.correctAnswer
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : 'bg-blue-50/60 border-blue-200 text-slate-800'
                  }`}>
                    <div className="flex items-center gap-2 font-semibold text-sm mb-2">
                      {selectedOption === currentQ.correctAnswer ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Parabéns, você acertou! 💙</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-500" />
                          <span className="text-rose-700 font-bold">Resposta correta: Opção {String.fromCharCode(65 + currentQ.correctAnswer)}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed mb-3">
                      {currentQ.explanation}
                    </p>
                    {currentQ.psychologySource && (
                      <div className="text-xs font-medium text-slate-500 pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                        <span>Fonte / Referência Teórica: <strong>{currentQ.psychologySource}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Finish Card */
              <div className="bg-white rounded-3xl p-8 text-center max-w-xl mx-auto shadow-sm border border-blue-100">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Quiz Concluído! 🎉</h3>
                <p className="text-slate-600 text-sm mb-6">
                  Você acertou <strong className="text-blue-600 text-lg">{score}</strong> de <strong>{questions.length}</strong> questões.
                </p>

                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 mb-6 text-sm text-blue-900 font-medium">
                  {score === questions.length ? (
                    "UAU! Gabarito absoluto! O CRM-06 já pode ser emitido! Parabéns, meu amor! ✨👏"
                  ) : score >= questions.length * 0.7 ? (
                    "Excelente desempenho! Você domina muito bem essa matéria. Só mais uma repassada e a nota 10 tá garantida! 📚"
                  ) : (
                    "Bom treino! Psicologia tem muitas nuances. Aproveite para perguntar para o Tutor de IA as questões que você ficou com dúvida! 💡"
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={restartQuiz}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refazer Este Quiz
                  </button>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    <UploadCloud className="w-4 h-4" />
                    Gerar Novo com Resumo
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ANEXAR RESUMO & GERAR COM IA */}
        {activeTab === 'create' && (
          <div className="max-w-3xl mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-blue-100">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Personalizar Quiz para a Prova</h2>
                <p className="text-sm text-slate-500">
                  Cole o resumo da matéria da faculdade ou os slides para a inteligência artificial formular questões exatamente no estilo cobrado pela sua matéria.
                </p>
              </div>
            </div>

            <form onSubmit={handleGenerateQuiz} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Tema ou Disciplina
                </label>
                <input
                  type="text"
                  placeholder="Ex: Psicopatologia (Transtornos de Humor), TCC, Behaviorismo, Psicanálise..."
                  value={subjectTitle}
                  onChange={(e) => setSubjectTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Resumo das Aulas / Anotações
                  </label>
                  <label className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer flex items-center gap-1">
                    <UploadCloud className="w-3.5 h-3.5" />
                    Carregar arquivo .txt
                    <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
                <textarea
                  rows={6}
                  placeholder="Cole aqui o conteúdo dos seus resumos, anotações de aula, tópicos de slides ou os casos clínicos que o professor passou..."
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Quantidade de Questões
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value={3}>3 Questões rápidas</option>
                    <option value={5}>5 Questões (Padrão)</option>
                    <option value={8}>8 Questões aprofundadas</option>
                    <option value={10}>10 Questões (Simulado completo)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition shadow-md shadow-blue-500/20"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Criando Quiz com IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Gerar Quiz Personalizado
                    </>
                  )}
                </button>
              </div>

              {genError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {genError}
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB 3: TUTOR IA & DÚVIDAS */}
        {activeTab === 'tutor' && (
          <div className="max-w-4xl mx-auto flex flex-col h-[650px] bg-white rounded-3xl shadow-sm border border-blue-100 overflow-hidden">
            {/* Chat header */}
            <div className="px-6 py-4 border-b border-blue-100/80 bg-blue-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">Tutor de Psicologia da Malu</h3>
                  <p className="text-xs text-blue-600">Discuta teorias, tire dúvidas de provas e descubra referências</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>

            {/* Chat history */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-1">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-slate-100/90 text-slate-800 rounded-bl-xs border border-slate-200/60 whitespace-pre-wrap'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-100 rounded-2xl p-4 text-sm text-slate-500 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    Consultando literatura de psicologia e organizando a resposta...
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="px-6 py-2 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-slate-500 shrink-0 font-medium">Sugestões rápidas:</span>
              <button
                onClick={() => handleSendMessage('Qual a diferença entre reforço negativo e punição positiva de acordo com Skinner?')}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-blue-600 shrink-0 hover:border-blue-300 transition"
              >
                Reforço Negativo vs Punição
              </button>
              <button
                onClick={() => handleSendMessage('Como diferenciar um delírio de uma ideia sobrevalorada segundo Dalgalarrondo?')}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-blue-600 shrink-0 hover:border-blue-300 transition"
              >
                Delírio vs Ideia Sobrevalorada
              </button>
              <button
                onClick={() => handleSendMessage('Quais são os principais critérios diagnósticos do Episódio Depressivo Maior no DSM-5-TR?')}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-600 hover:text-blue-600 shrink-0 hover:border-blue-300 transition"
              >
                Critérios DSM-5-TR Depressão
              </button>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  placeholder="Pergunte sobre qualquer autor, teoria, ou tire dúvidas da prova..."
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={!inputQuestion.trim() || isChatLoading}
                  className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition shadow-md shadow-blue-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-blue-100/60 bg-white/60 py-4 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-1">
          Feito com muito carinho por <strong className="text-slate-700">Paulo</strong> para a futura psicóloga <strong className="text-blue-600">Malu</strong> 💙
        </p>
      </footer>
    </div>
  );
}
