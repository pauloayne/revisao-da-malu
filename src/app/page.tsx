'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Heart, 
  Brain, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Send, 
  UploadCloud, 
  FileText, 
  GraduationCap, 
  ChevronRight, 
  MessageSquare,
  Award,
  Lightbulb,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Camera,
  Trash2,
  FileCheck2,
  Calendar as CalendarIcon,
  ChevronLeft,
  Play,
  Plus,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEFAULT_QUESTIONS } from '../data/defaultQuestions';
import { Question, ScheduledExam } from '../types/quiz';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

const TOTAL_COUPLE_PHOTOS = 64;

const LOVE_NOTES = [
  "Orgulho da minha futura psicóloga! 💜",
  "Vai dar tudo certo na prova, meu amor!",
  "Você nasceu pra brilhar na Psicologia ✨",
  "Sempre torcendo por você! — Paulo",
  "Cada questão te deixa mais perto do CRP!",
  "Te amo demais! Bons estudos, linda 💜",
  "A psicóloga mais incrível do mundo!"
];

export default function RevisaoDaMalu() {
  const [activeTab, setActiveTab] = useState<'quiz' | 'tutor' | 'create'>('quiz');

  // Estado das fotos decorativas do casal (de 1 a 64)
  const [photoSeed, setPhotoSeed] = useState(1);

  const getPhotoUrl = (offset: number) => {
    const idx = ((photoSeed + offset - 1) % TOTAL_COUPLE_PHOTOS) + 1;
    return `/casal/foto-${idx}.jpg`;
  };

  const shufflePhotos = () => {
    setPhotoSeed(prev => ((prev + 4) % TOTAL_COUPLE_PHOTOS) + 1);
  };

  // Estado do Quiz
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS["Geral"]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  // Estado de upload de resumos / criação de quiz
  const [subjectTitle, setSubjectTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [showBuilderDetails, setShowBuilderDetails] = useState(false);
  const [builderMode, setBuilderMode] = useState<'describe' | 'upload'>('describe');
  const [currentQuizTitle, setCurrentQuizTitle] = useState('Revisão Geral de Psicologia');

  // Estado do Calendário de Provas Agendadas
  const [scheduledExams, setScheduledExams] = useState<ScheduledExam[]>([]);
  const [todayIso, setTodayIso] = useState<string>('2026-10-27');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('2026-10-27');
  const [calendarMonth, setCalendarMonth] = useState<{ year: number; month: number }>({
    year: 2026,
    month: 9
  });
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [activeScheduledExamId, setActiveScheduledExamId] = useState<string | null>(null);

  // Inicializar data atual no cliente e carregar provas agendadas do localStorage
  useEffect(() => {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setTodayIso(iso);
    setSelectedCalendarDate(iso);
    setCalendarMonth({ year: now.getFullYear(), month: now.getMonth() });

    try {
      const raw = localStorage.getItem('malu_scheduled_exams_v1');
      if (raw) {
        setScheduledExams(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Erro ao ler calendário:', e);
    }
  }, []);

  const persistScheduledExams = (nextList: ScheduledExam[]) => {
    setScheduledExams(nextList);
    try {
      localStorage.setItem('malu_scheduled_exams_v1', JSON.stringify(nextList));
    } catch (e) {
      // Se o PDF for muito grande para o localStorage, salva sem o base64 pesado mas mantém as questões/resumo
      const lightList = nextList.map(item => ({ ...item, pdfBase64: null }));
      try {
        localStorage.setItem('malu_scheduled_exams_v1', JSON.stringify(lightList));
      } catch {}
    }
  };

  // Estado do Tutor IA
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      content: 'Olá, Malu! 💜 Sou seu Preceptor de Psicologia. Pode me mandar qualquer dúvida teórica, pedir para explicar conceitos (como Nietzsche na psicologia, mecanismos de defesa, TCC, behaviorismo, etc.), ou pedir referências bibliográficas para suas provas. Como posso te ajudar hoje?'
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
        colors: ['#3a1de1', '#6b4de9', '#9d7ef0', '#ceaef8', '#ffdfff']
      });
    }
  };

  const handleNextQuestion = () => {
    shufflePhotos();
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
    shufflePhotos();
    setCurrentIdx(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsFinished(false);
  };

  // Carregar arquivo de resumo (.pdf ou .txt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    if (!subjectTitle.trim()) {
      setSubjectTitle(cleanName);
    }

    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const base64Content = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
          setPdfBase64(base64Content);
          setPdfFileName(file.name);
        }
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setSummaryText(content);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const clearAttachedPdf = () => {
    setPdfBase64(null);
    setPdfFileName(null);
  };

  // Gerar novo Quiz com IA
  const handleGenerateQuiz = async (e?: React.FormEvent, customTopic?: string, customDesc?: string) => {
    if (e) e.preventDefault();
    const topicToUse = customTopic !== undefined ? customTopic : subjectTitle;
    const descToUse = customDesc !== undefined ? customDesc : examDescription;

    if (!topicToUse.trim() && !descToUse.trim() && !summaryText.trim() && !pdfBase64) {
      setGenError('Pesquise um assunto/autor (ex: Nietzsche), descreva o que vai cair na prova ou anexe o PDF/resumo da faculdade.');
      return;
    }
    setIsGenerating(true);
    setGenError(null);

    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicToUse,
          description: descToUse,
          summary: summaryText,
          pdfBase64,
          pdfFileName,
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
        setCurrentQuizTitle(
          topicToUse.trim() ||
          (pdfFileName ? pdfFileName.replace(/\.[^/.]+$/, '') : summaryText.trim() ? 'Quiz do Resumo Anexado' : 'Quiz Personalizado')
        );
        setShowBuilderDetails(false);
        shufflePhotos();
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

  // Agendar Prova no Calendário (já deixando o Quiz pronto para o dia!)
  const handleScheduleExam = async (preGenerateQuiz: boolean) => {
    if (!subjectTitle.trim() && !examDescription.trim() && !summaryText.trim() && !pdfBase64) {
      setGenError('Informe a matéria/autor, o que vai cair na prova ou anexe o PDF para agendar no calendário.');
      return;
    }

    setIsGenerating(true);
    setGenError(null);
    setSaveSuccessMsg(null);

    const examTitle =
      subjectTitle.trim() ||
      (pdfFileName ? pdfFileName.replace(/\.[^/.]+$/, '') : 'Prova de Psicologia');

    try {
      let generatedQuestions: Question[] | undefined = undefined;

      if (preGenerateQuiz) {
        const res = await fetch('/api/quiz/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: examTitle,
            description: examDescription,
            summary: summaryText,
            pdfBase64,
            pdfFileName,
            count: questionCount
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao preparar simulado para a agenda');
        if (data.questions && data.questions.length > 0) {
          generatedQuestions = data.questions;
        }
      }

      const newExam: ScheduledExam = {
        id: `${Date.now()}`,
        title: examTitle,
        examDate: selectedCalendarDate,
        description: examDescription,
        summaryText,
        pdfBase64,
        pdfFileName,
        questionCount,
        savedQuestions: generatedQuestions,
        createdAt: new Date().toISOString()
      };

      const updated = [...scheduledExams, newExam].sort((a, b) => a.examDate.localeCompare(b.examDate));
      persistScheduledExams(updated);

      setSaveSuccessMsg(
        preGenerateQuiz
          ? `Prova "${examTitle}" agendada para ${formatDateBR(selectedCalendarDate)} com Simulado já pronto! 💜`
          : `Prova "${examTitle}" salva no calendário para ${formatDateBR(selectedCalendarDate)}!`
      );
      setSubjectTitle('');
      setExamDescription('');
      setSummaryText('');
      setPdfBase64(null);
      setPdfFileName(null);
    } catch (err: any) {
      setGenError(err.message || 'Erro ao salvar prova na agenda.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Iniciar ou sortear novas questões de uma prova agendada no calendário
  const startScheduledExamQuiz = async (exam: ScheduledExam, forceNewQuestions = false) => {
    setSubjectTitle(exam.title);
    setExamDescription(exam.description || '');
    setSummaryText(exam.summaryText || '');
    setPdfBase64(exam.pdfBase64 || null);
    setPdfFileName(exam.pdfFileName || null);
    setQuestionCount(exam.questionCount || 5);
    setActiveScheduledExamId(exam.id);

    // Se já tem questões prontas salvas e não pediu inéditas, abre instantaneamente!
    if (exam.savedQuestions && exam.savedQuestions.length > 0 && !forceNewQuestions) {
      setQuestions(exam.savedQuestions);
      setCurrentIdx(0);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setScore(0);
      setIsFinished(false);
      setCurrentQuizTitle(exam.title);
      shufflePhotos();
      setActiveTab('quiz');
      return;
    }

    // Caso contrário, gera na hora com base nos conteúdos anexados daquela prova
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: exam.title,
          description: exam.description,
          summary: exam.summaryText,
          pdfBase64: exam.pdfBase64,
          pdfFileName: exam.pdfFileName,
          count: exam.questionCount || 5
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar quiz da prova agendada');

      if (data.questions && data.questions.length > 0) {
        const updatedList = scheduledExams.map(item =>
          item.id === exam.id ? { ...item, savedQuestions: data.questions } : item
        );
        persistScheduledExams(updatedList);

        setQuestions(data.questions);
        setCurrentIdx(0);
        setSelectedOption(null);
        setIsAnswerSubmitted(false);
        setScore(0);
        setIsFinished(false);
        setCurrentQuizTitle(exam.title);
        shufflePhotos();
        setActiveTab('quiz');
      }
    } catch (err: any) {
      setGenError(err.message || 'Erro ao abrir simulado da prova.');
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteScheduledExam = (id: string) => {
    const next = scheduledExams.filter(item => item.id !== id);
    persistScheduledExams(next);
  };

  const formatDateBR = (isoDate: string) => {
    const [y, m, d] = isoDate.split('-');
    if (!y || !m || !d) return isoDate;
    return `${d}/${m}/${y}`;
  };

  // Matemática pura de calendário (evita qualquer chamada a `new Date()` durante o pré-render do Next.js 16)
  const toSerialDay = (y: number, m: number, d: number) => {
    const a = Math.floor((14 - m) / 12);
    const y2 = y + 4800 - a;
    const m2 = m + 12 * a - 3;
    return (
      d +
      Math.floor((153 * m2 + 2) / 5) +
      365 * y2 +
      Math.floor(y2 / 4) -
      Math.floor(y2 / 100) +
      Math.floor(y2 / 400) -
      32045
    );
  };

  const getDaysRemainingLabel = (isoDate: string) => {
    const [ty, tm, td] = todayIso.split('-').map(Number);
    const [y, m, d] = isoDate.split('-').map(Number);
    const todaySerial = toSerialDay(ty || 2026, tm || 10, td || 27);
    const targetSerial = toSerialDay(y || 2026, m || 10, d || 27);
    const diffDays = targetSerial - todaySerial;
    if (diffDays === 0) return { text: 'É HOJE! Boa prova, meu amor! 💜', urgent: true };
    if (diffDays === 1) return { text: 'É amanhã!', urgent: true };
    if (diffDays > 1) return { text: `Faltam ${diffDays} dias`, urgent: diffDays <= 3 };
    return { text: `Realizada há ${Math.abs(diffDays)} dia(s)`, urgent: false };
  };

  // Helpers do Grid do Calendário Mensal
  const changeCalendarMonth = (offset: number) => {
    setCalendarMonth(prev => {
      let nextMonth = prev.month + offset;
      let nextYear = prev.year;
      while (nextMonth < 0) {
        nextMonth += 12;
        nextYear -= 1;
      }
      while (nextMonth > 11) {
        nextMonth -= 12;
        nextYear += 1;
      }
      return { year: nextYear, month: nextMonth };
    });
  };

  const calendarYear = calendarMonth.year;
  const calendarMonthIdx = calendarMonth.month;
  const monthNamesPT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const isLeapYear = (calendarYear % 4 === 0 && calendarYear % 100 !== 0) || calendarYear % 400 === 0;
  const monthLengths = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const firstDayOfWeek = (toSerialDay(calendarYear, calendarMonthIdx + 1, 1) + 1) % 7;
  const daysInMonth = monthLengths[calendarMonthIdx] || 30;

  // Perguntar ao Tutor de IA (com Streaming em tempo real)
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputQuestion;
    if (!textToSend.trim() || isChatLoading) return;

    const newMsgs: ChatMsg[] = [...chatMessages, { role: 'user', content: textToSend }];
    setChatMessages([...newMsgs, { role: 'assistant', content: '' }]);
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
          pdfBase64,
          pdfFileName,
          context: `${summaryText ? `Resumo estudado: ${summaryText.slice(0, 500)}... ` : ''}${examDescription ? `Foco da prova: ${examDescription}... ` : ''}${contextText}`
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha na resposta do assistente');
      }

      if (!res.body) throw new Error('Resposta sem stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setChatMessages([...newMsgs, { role: 'assistant', content: accumulated }]);
      }
    } catch (err: any) {
      setChatMessages([
        ...newMsgs,
        { role: 'assistant', content: `Ops! Tive um problema: ${err.message}.` }
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
  const currentNote = LOVE_NOTES[photoSeed % LOVE_NOTES.length];

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7ff] text-[#140d2b] relative selection:bg-color4 selection:text-color1">
      {/* Subtle organic background mesh */}
      <div
        className="fixed inset-0 pointer-events-none opacity-60 -z-10"
        style={{
          backgroundImage: `radial-gradient(at 12% 8%, #ffdfff 0px, transparent 45%), radial-gradient(at 88% 15%, #ceaef8 0px, transparent 40%), radial-gradient(at 50% 95%, #ffdfff 0px, transparent 50%)`
        }}
      />

      {/* Top Editorial Header */}
      <header className="sticky top-0 z-30 bg-[#faf7ff]/90 backdrop-blur-md border-b-2 border-[#140d2b]/10">
        <div className="max-w-6xl mx-auto px-4 py-3.5 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Couple mini-frame next to logo */}
            <button
              type="button"
              onClick={shufflePhotos}
              title="Clique para trocar nossas fotos 💜"
              className="relative group flex items-center cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#140d2b] border-2 border-color1 flex items-center justify-center text-color5 shadow-[3px_3px_0px_#6b4de9] z-10">
                <Brain className="w-6 h-6 text-color4" />
              </div>
              <div className="w-12 h-12 -ml-3 rounded-2xl overflow-hidden border-2 border-white shadow-md rotate-6 group-hover:rotate-0 group-hover:scale-105 transition-all">
                <img
                  src={getPhotoUrl(14)}
                  alt="Paulo e Malu"
                  className="w-full h-full object-cover"
                />
              </div>
            </button>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-editorial text-2xl font-bold tracking-tight text-[#140d2b]">
                  Revisão da Malu
                </h1>
                <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-full bg-color1 text-white shadow-xs">
                  Psicologia
                </span>
              </div>
              <p className="text-xs text-[#4a3e6d] font-semibold flex items-center gap-1.5 mt-0.5">
                <Heart className="w-3.5 h-3.5 fill-color1 text-color1" />
                Caderno de estudos para minha futura psicóloga • <span className="text-color1 font-bold">Ass: Paulo</span>
              </p>
            </div>
          </div>

          {/* Tactile Navigation Tabs */}
          <nav className="flex items-center p-1.5 bg-white rounded-2xl border-2 border-[#140d2b]/15 shadow-[3px_3px_0px_rgba(20,13,43,0.08)]">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-color1 text-white shadow-[2px_2px_0px_#140d2b]'
                  : 'text-[#3b3054] hover:text-color1 hover:bg-color5/40'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Simulado & Pesquisa
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-color1 text-white shadow-[2px_2px_0px_#140d2b]'
                  : 'text-[#3b3054] hover:text-color1 hover:bg-color5/40'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Calendário & Provas
              {scheduledExams.length > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-extrabold ${
                  activeTab === 'create' ? 'bg-white text-color1' : 'bg-color1 text-white'
                }`}>
                  {scheduledExams.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tutor')}
              className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'tutor'
                  ? 'bg-color1 text-white shadow-[2px_2px_0px_#140d2b]'
                  : 'text-[#3b3054] hover:text-color1 hover:bg-color5/40'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Preceptor IA
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* TAB 1: QUIZ */}
        {activeTab === 'quiz' && (
          <div className="space-y-7">
            {/* Faixa Rápida de Provas Agendadas no Calendário (para quando chegar o dia ela clicar e fazer na hora) */}
            {scheduledExams.length > 0 && (
              <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#140d2b]/15 shadow-[0_8px_24px_-12px_rgba(58,29,225,0.18)]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-color1 text-white flex items-center justify-center shadow-[2px_2px_0px_#140d2b]">
                      <CalendarIcon className="w-4 h-4" />
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#140d2b]">
                      Suas Próximas Provas Agendadas
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className="text-xs font-bold text-color1 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Abrir Calendário & Agendar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {scheduledExams.slice(0, 3).map((exam) => {
                    const countdown = getDaysRemainingLabel(exam.examDate);
                    const isActive = activeScheduledExamId === exam.id;
                    return (
                      <div
                        key={exam.id}
                        className={`p-3.5 rounded-2xl border-2 transition flex flex-col justify-between gap-3 ${
                          isActive
                            ? 'bg-[#f4edff] border-color1 shadow-[3px_3px_0px_#140d2b]'
                            : 'bg-[#faf7ff] border-[#decff7] hover:border-color2'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-color1 bg-color5/70 px-2 py-0.5 rounded-lg">
                              <Clock className="w-3 h-3" />
                              {formatDateBR(exam.examDate)}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                countdown.urgent
                                  ? 'bg-amber-300 text-[#140d2b]'
                                  : 'bg-white text-[#4a3e6d] border border-[#decff7]'
                              }`}
                            >
                              {countdown.text}
                            </span>
                          </div>
                          <h4 className="font-bold text-sm text-[#140d2b] truncate mt-1">
                            {exam.title}
                          </h4>
                          <p className="text-[11px] text-[#5e5282] truncate">
                            {exam.pdfFileName
                              ? `📄 ${exam.pdfFileName}`
                              : exam.description
                              ? exam.description
                              : 'Conteúdo salvo na agenda'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isGenerating}
                            onClick={() => startScheduledExamQuiz(exam, false)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-color1 hover:bg-color2 text-white text-xs font-extrabold transition shadow-[2px_2px_0px_#140d2b] cursor-pointer disabled:opacity-50"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            {exam.savedQuestions?.length ? 'Fazer Quiz Pronto' : 'Gerar & Fazer Quiz'}
                          </button>
                          <button
                            type="button"
                            disabled={isGenerating}
                            onClick={() => startScheduledExamQuiz(exam, true)}
                            title="Sortear questões inéditas desta prova"
                            className="p-2 rounded-xl bg-white hover:bg-color5/60 text-color1 border-2 border-[#cbbdf0] transition cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating && isActive ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Hero Command Bar: Pesquisa de Assunto, Descrição da Prova ou Resumo + Polaroid Decorativa */}
            <div className="bg-[#1b113a] text-white rounded-3xl p-5 sm:p-7 border-2 border-[#140d2b] shadow-[0_12px_30px_-10px_rgba(58,29,225,0.35)] relative overflow-hidden">
              {/* Subtle accent glow inside dark banner */}
              <div className="absolute -right-10 -bottom-16 w-60 h-60 bg-color1/35 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-5 relative z-10">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-color4">
                      Gerador Sob Medida • Sem precisar de resumo
                    </span>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 text-color5 text-[11px] font-medium">
                      <Heart className="w-3 h-3 fill-color4 text-color4" />
                      {currentNote}
                    </span>
                  </div>
                  <h2 className="font-editorial text-xl sm:text-2xl font-bold text-white mt-1">
                    O que vamos revisar para a prova hoje, Malu?
                  </h2>
                </div>

                {/* Dupla de Polaroids Afetivas (Discretas no canto direito + seletor de questões) */}
                <div className="flex items-center justify-between lg:justify-end gap-4">
                  <button
                    type="button"
                    onClick={shufflePhotos}
                    title="Clique para sortear outras fotos nossas 💜"
                    className="flex items-center group cursor-pointer"
                  >
                    <div className="bg-white p-1 pb-2.5 rounded-xl shadow-md -rotate-6 group-hover:rotate-0 transition-transform w-14 sm:w-16">
                      <img
                        src={getPhotoUrl(0)}
                        alt="Nós dois"
                        className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg"
                      />
                    </div>
                    <div className="bg-white p-1 pb-2.5 rounded-xl shadow-md rotate-6 -ml-3 group-hover:rotate-0 transition-transform w-14 sm:w-16">
                      <img
                        src={getPhotoUrl(29)}
                        alt="Malu"
                        className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg"
                      />
                    </div>
                  </button>

                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] text-color4 font-bold uppercase tracking-wider">Tamanho:</span>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-xl border-2 border-color3/50 bg-[#271952] text-white text-xs font-bold focus:outline-none focus:border-color4 cursor-pointer"
                    >
                      <option value={3} className="bg-[#1b113a] text-white">3 questões</option>
                      <option value={5} className="bg-[#1b113a] text-white">5 questões</option>
                      <option value={8} className="bg-[#1b113a] text-white">8 questões</option>
                      <option value={10} className="bg-[#1b113a] text-white">10 questões</option>
                    </select>
                  </div>
                </div>
              </div>

              <form onSubmit={(e) => handleGenerateQuiz(e)} className="space-y-4 relative z-10">
                {/* High-contrast Search Input */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-5 h-5 text-color1 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Digite um autor, filósofo ou tema (ex: Nietzsche, Freud, TCC, Dalgalarrondo)..."
                      value={subjectTitle}
                      onChange={(e) => setSubjectTitle(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-color3 bg-white text-[#140d2b] font-semibold placeholder:text-[#6e6294] placeholder:font-normal focus:outline-none focus:ring-4 focus:ring-color3/40 focus:border-color5 text-sm sm:text-base shadow-inner transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-sm sm:text-base text-white bg-color1 hover:bg-color2 border-2 border-color4/40 disabled:opacity-50 transition-all shadow-[4px_4px_0px_#ceaef8] active:translate-y-0.5 cursor-pointer shrink-0"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Elaborando Questões...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 text-color5" />
                        Criar Quiz Agora
                      </>
                    )}
                  </button>
                </div>

                {/* Action Pills: Descrever prova sem resumo OU Anexar resumo + Sugestões */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (showBuilderDetails && builderMode === 'describe') {
                          setShowBuilderDetails(false);
                        } else {
                          setBuilderMode('describe');
                          setShowBuilderDetails(true);
                        }
                      }}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                        showBuilderDetails && builderMode === 'describe'
                          ? 'bg-color5 text-[#140d2b] border-white shadow-sm'
                          : examDescription.trim()
                          ? 'bg-color2 text-white border-color4'
                          : 'bg-[#281952] text-color5 hover:bg-[#342269] border-color3/50'
                      }`}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      {examDescription.trim() ? 'Foco da prova configurado ✓' : 'Explicar o que vai cair na prova (Sem resumo)'}
                      {showBuilderDetails && builderMode === 'describe' ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (showBuilderDetails && builderMode === 'upload') {
                          setShowBuilderDetails(false);
                        } else {
                          setBuilderMode('upload');
                          setShowBuilderDetails(true);
                        }
                      }}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                        showBuilderDetails && builderMode === 'upload'
                          ? 'bg-color5 text-[#140d2b] border-white shadow-sm'
                          : summaryText.trim() || pdfFileName
                          ? 'bg-color2 text-white border-color4'
                          : 'bg-[#281952] text-color5 hover:bg-[#342269] border-color3/50'
                      }`}
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      {pdfFileName
                        ? `PDF: ${pdfFileName.slice(0, 22)}${pdfFileName.length > 22 ? '...' : ''} ✓`
                        : summaryText.trim()
                        ? 'Resumo anexado ✓'
                        : 'Anexar PDF da faculdade ou colar resumo'}
                      {showBuilderDetails && builderMode === 'upload' ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Quick Topic Chips */}
                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                    <span className="text-color4 text-xs font-bold shrink-0">Temas rápidos:</span>
                    {['Nietzsche', 'Psicanálise (Freud)', 'Behaviorismo', 'Psicopatologia'].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setSubjectTitle(chip);
                          handleGenerateQuiz(undefined, chip);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#281952] hover:bg-color1 text-white border border-color3/40 font-semibold text-xs transition shrink-0 cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Drawer: Descrever prova ou Colar Resumo */}
                {showBuilderDetails && (
                  <div className="pt-4 mt-2 border-t border-color3/30 space-y-3">
                    {builderMode === 'describe' ? (
                      <div className="bg-white rounded-2xl p-4 border-2 border-color4 text-[#140d2b]">
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-color1 mb-1.5">
                          Descreva com suas palavras sobre o que vai ser a prova:
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Ex: Quero estudar Nietzsche para a prova de psicologia, focando em vontade de potência, crítica à moral, ressentimento, eterno retorno e como isso aparece na clínica..."
                          value={examDescription}
                          onChange={(e) => setExamDescription(e.target.value)}
                          className="w-full p-3 rounded-xl border-2 border-[#d8cef0] bg-[#faf7ff] text-[#140d2b] font-medium placeholder:text-[#6e6294] focus:bg-white focus:outline-none focus:border-color1 text-sm leading-relaxed"
                        />
                      </div>
                    ) : (
                      <div className="bg-white rounded-2xl p-4 border-2 border-color4 text-[#140d2b] space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="block text-xs font-extrabold uppercase tracking-wider text-color1">
                            Envie o PDF da faculdade (slides/artigos) ou cole o texto:
                          </label>
                          <label className="text-xs text-white bg-color1 hover:bg-color2 font-bold cursor-pointer flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition shadow-[2px_2px_0px_#140d2b]">
                            <UploadCloud className="w-4 h-4" />
                            Anexar PDF da Faculdade (.pdf ou .txt)
                            <input type="file" accept=".pdf,.txt,application/pdf" onChange={handleFileUpload} className="hidden" />
                          </label>
                        </div>

                        {pdfFileName && (
                          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f3ecff] border-2 border-color1 text-[#140d2b]">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileCheck2 className="w-5 h-5 text-color1 shrink-0" />
                              <div className="truncate">
                                <p className="text-xs font-extrabold text-color1 uppercase tracking-wider">PDF Anexado com Sucesso</p>
                                <p className="text-sm font-bold truncate">{pdfFileName}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={clearAttachedPdf}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remover
                            </button>
                          </div>
                        )}

                        <textarea
                          rows={3}
                          placeholder="Se quiser, você também pode colar anotações extras ou tópicos aqui..."
                          value={summaryText}
                          onChange={(e) => setSummaryText(e.target.value)}
                          className="w-full p-3 rounded-xl border-2 border-[#d8cef0] bg-[#faf7ff] text-[#140d2b] font-medium placeholder:text-[#6e6294] focus:bg-white focus:outline-none focus:border-color1 text-sm leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                )}

                {genError && (
                  <div className="p-3.5 rounded-xl bg-rose-100 border-2 border-rose-400 text-rose-950 text-xs font-bold">
                    {genError}
                  </div>
                )}
              </form>
            </div>

            {!isFinished && currentQ ? (
              <div className="bg-white rounded-3xl p-6 sm:p-9 border-2 border-[#140d2b]/15 shadow-[0_10px_30px_-12px_rgba(20,13,43,0.12)] relative overflow-hidden">
                {/* Top Status Bar inside Quiz Card */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b-2 border-[#f0e8ff]">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#140d2b] text-color5 tracking-wide">
                      CADERNO: {currentQuizTitle.toUpperCase()}
                    </span>
                    {examDescription.trim() && (
                      <span className="px-2.5 py-1 rounded-lg bg-color5 text-color1 text-xs font-bold border border-color4">
                        Roteiro de prova ativo
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateQuiz(undefined, subjectTitle || currentQuizTitle)}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-color1 hover:text-white bg-color5/70 hover:bg-color1 px-3.5 py-2 rounded-xl border-2 border-color3/60 transition cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    Sortear novas questões deste tema
                  </button>
                </div>

                {/* Progress bar */}
                <div className="flex items-center justify-between text-xs font-extrabold text-[#4a3e6d] uppercase tracking-wider mb-2.5">
                  <span>Questão {currentIdx + 1} de {questions.length}</span>
                  <span className="px-2.5 py-0.5 rounded-md bg-color5 text-color1">
                    Acertos: {score}/{questions.length}
                  </span>
                </div>
                <div className="w-full bg-[#efe8ff] h-3 rounded-full overflow-hidden mb-7 p-0.5 border border-color4/60">
                  <div 
                    className="bg-gradient-to-r from-color1 via-color2 to-color3 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                  />
                </div>

                {/* Question Title with Editorial Serif Font */}
                <h2 className="font-editorial text-xl sm:text-2xl font-bold text-[#140d2b] leading-snug mb-7">
                  {currentQ.question}
                </h2>

                {/* Options List */}
                <div className="space-y-3.5 mb-7">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQ.correctAnswer;
                    
                    let btnStyle = "border-2 border-[#dfd5f7] hover:border-color1 hover:bg-[#faf7ff] text-[#1e1538] bg-white";
                    
                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        btnStyle = "border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold shadow-[3px_3px_0px_#059669]";
                      } else if (isSelected && !isCorrect) {
                        btnStyle = "border-2 border-rose-500 bg-rose-50 text-rose-950 font-medium";
                      } else {
                        btnStyle = "border-2 border-slate-200 opacity-55 text-slate-500 bg-slate-50/50";
                      }
                    } else if (isSelected) {
                      btnStyle = "border-2 border-color1 bg-[#f5eeff] text-[#140d2b] font-semibold shadow-[4px_4px_0px_#3a1de1]";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(idx)}
                        disabled={isAnswerSubmitted}
                        className={`w-full p-4 sm:p-5 text-left rounded-2xl transition-all flex items-start gap-4 cursor-pointer disabled:cursor-default ${btnStyle}`}
                      >
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold shrink-0 transition-colors border ${
                          isAnswerSubmitted && isCorrect
                            ? 'bg-emerald-600 text-white border-emerald-700'
                            : isAnswerSubmitted && isSelected && !isCorrect
                            ? 'bg-rose-600 text-white border-rose-700'
                            : isSelected
                            ? 'bg-color1 text-white border-color1'
                            : 'bg-[#f3ecff] text-color1 border-color4'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm sm:text-base pt-0.5 leading-relaxed">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t-2 border-[#f0e8ff]">
                  <div>
                    {isAnswerSubmitted && (
                      <button
                        onClick={askTutorAboutCurrentQuestion}
                        className="inline-flex items-center gap-2 text-xs font-bold text-color1 hover:text-white bg-color5 hover:bg-color1 px-4 py-2.5 rounded-xl border-2 border-color3/50 transition-all cursor-pointer"
                      >
                        <Lightbulb className="w-4 h-4" />
                        Debater esta questão com o Preceptor IA
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    {!isAnswerSubmitted ? (
                      <button
                        onClick={handleConfirmAnswer}
                        disabled={selectedOption === null}
                        className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm text-white bg-color1 hover:bg-color2 disabled:opacity-40 disabled:hover:bg-color1 transition-all shadow-[4px_4px_0px_#140d2b] disabled:shadow-none cursor-pointer"
                      >
                        Confirmar Alternativa
                      </button>
                    ) : (
                      <button
                        onClick={handleNextQuestion}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-sm text-white bg-color1 hover:bg-color2 transition-all shadow-[4px_4px_0px_#140d2b] cursor-pointer"
                      >
                        {currentIdx + 1 < questions.length ? 'Próxima Questão' : 'Finalizar Caderno'}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Explanation Box with Sweet Photo Stamp when Correct */}
                {isAnswerSubmitted && (
                  <div className={`mt-7 p-6 rounded-2xl border-2 transition-all ${
                    selectedOption === currentQ.correctAnswer
                      ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950'
                      : 'bg-[#f8f3ff] border-color3 text-[#140d2b]'
                  }`}>
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2 font-bold text-base">
                        {selectedOption === currentQ.correctAnswer ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span className="text-emerald-800">Mandou muito bem, Malu! Resposta exata! 💜</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span className="text-rose-800">Gabarito oficial: Alternativa {String.fromCharCode(65 + currentQ.correctAnswer)}</span>
                          </>
                        )}
                      </div>

                      {selectedOption === currentQ.correctAnswer && (
                        <div className="hidden sm:flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border border-emerald-300 shadow-xs shrink-0">
                          <img
                            src={getPhotoUrl(currentIdx * 7)}
                            alt="Paulo e Malu"
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <span className="text-[11px] font-bold text-emerald-800">Orgulho do Paulo! ✨</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm sm:text-base leading-relaxed mb-4 text-[#231942]">
                      {currentQ.explanation}
                    </p>
                    {currentQ.psychologySource && (
                      <div className="text-xs font-bold text-color1 pt-3 border-t border-color4/60 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-color1 shrink-0" />
                        <span>Referência Acadêmica: <strong className="text-[#140d2b]">{currentQ.psychologySource}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Finish Card with Couple Polaroid Celebration */
              <div className="bg-white rounded-3xl p-8 sm:p-10 text-center max-w-2xl mx-auto border-2 border-[#140d2b] shadow-[6px_6px_0px_#3a1de1]">
                {/* Trio of Polaroids celebrating */}
                <div className="flex items-center justify-center mb-6">
                  <div className="bg-white p-1.5 pb-4 rounded-2xl border-2 border-[#dfd5f7] shadow-md -rotate-6 w-24 sm:w-28">
                    <img
                      src={getPhotoUrl(5)}
                      alt="Nós"
                      className="w-full h-24 sm:h-28 object-cover rounded-xl"
                    />
                  </div>
                  <div className="bg-white p-1.5 pb-4 rounded-2xl border-2 border-color1 shadow-lg z-10 -mx-3 -mt-3 w-28 sm:w-32">
                    <img
                      src={getPhotoUrl(19)}
                      alt="Nós"
                      className="w-full h-28 sm:h-32 object-cover rounded-xl"
                    />
                  </div>
                  <div className="bg-white p-1.5 pb-4 rounded-2xl border-2 border-[#dfd5f7] shadow-md rotate-6 w-24 sm:w-28">
                    <img
                      src={getPhotoUrl(49)}
                      alt="Nós"
                      className="w-full h-24 sm:h-28 object-cover rounded-xl"
                    />
                  </div>
                </div>

                <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#140d2b] mb-2">
                  Caderno Concluído! 🎉
                </h3>
                <p className="text-[#4a3e6d] text-base mb-6 font-medium">
                  Você acertou <strong className="text-color1 text-xl font-extrabold">{score}</strong> de <strong>{questions.length}</strong> questões em <strong>{currentQuizTitle}</strong>.
                </p>

                <div className="p-5 rounded-2xl bg-[#f7f0ff] border-2 border-color3 mb-7 text-sm text-[#140d2b] font-semibold leading-relaxed">
                  {score === questions.length ? (
                    "UAU! Gabarito absoluto! O CRP já pode ser emitido! Parabéns, meu amor! ✨👏"
                  ) : score >= questions.length * 0.7 ? (
                    "Excelente desempenho! Você domina muito bem essa matéria. Só mais uma repassada e o 10 tá garantido! 📚"
                  ) : (
                    "Ótimo treino! Aproveite para gerar uma nova bateria de questões inéditas sobre esse tema ou debater com o Preceptor IA! 💡"
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => handleGenerateQuiz(undefined, subjectTitle || currentQuizTitle)}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-color1 hover:bg-color2 transition shadow-[3px_3px_0px_#140d2b] cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 text-color5 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Gerando Inéditas...' : 'Novas Questões Deste Assunto'}
                  </button>
                  <button
                    onClick={restartQuiz}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-[#140d2b] bg-color5 hover:bg-color4 transition border-2 border-[#140d2b]/20 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refazer Estas Questões
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CALENDÁRIO DE PROVAS & PLANEJADOR DE CONTEÚDOS */}
        {activeTab === 'create' && (
          <div className="space-y-7">
            {/* Banner de Cabeçalho do Calendário */}
            <div className="bg-[#1b113a] text-white rounded-3xl p-5 sm:p-7 border-2 border-[#140d2b] shadow-[0_12px_30px_-10px_rgba(58,29,225,0.3)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-color1 text-white flex items-center justify-center shrink-0 border-2 border-color4 shadow-[3px_3px_0px_#140d2b]">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-color4">
                    Organização de Semestre da Malu
                  </span>
                  <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-white mt-0.5">
                    Calendário de Provas & Conteúdos
                  </h2>
                  <p className="text-xs sm:text-sm text-color5/90 font-medium mt-1 max-w-2xl">
                    Escolha o dia da próxima prova no calendário, já deixe o PDF ou os temas anexados e o Quiz preparado. Quando chegar o dia, é só clicar em <strong>Fazer Quiz</strong>!
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={shufflePhotos}
                title="Trocar foto 💜"
                className="hidden sm:block bg-white p-1.5 pb-3 rounded-2xl border-2 border-[#140d2b] shadow-[3px_3px_0px_#140d2b] rotate-3 hover:rotate-0 transition shrink-0 cursor-pointer"
              >
                <img
                  src={getPhotoUrl(33)}
                  alt="Paulo e Malu"
                  className="w-16 h-16 object-cover rounded-xl"
                />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
              {/* COLUNA ESQUERDA (5 cols): Calendário Mensal Interativo + Lista de Provas Agendadas */}
              <div className="lg:col-span-5 space-y-6">
                {/* Card do Calendário Mensal */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#140d2b]/15 shadow-[0_10px_30px_-12px_rgba(20,13,43,0.12)]">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[#f0e8ff]">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-color1">
                        Selecione a data da prova
                      </span>
                      <h3 className="font-editorial text-xl font-bold text-[#140d2b]">
                        {monthNamesPT[calendarMonthIdx]} {calendarYear}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => changeCalendarMonth(-1)}
                        className="p-2 rounded-xl bg-[#faf7ff] hover:bg-color5 text-[#140d2b] border-2 border-[#decff7] transition cursor-pointer"
                        title="Mês anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => changeCalendarMonth(1)}
                        className="p-2 rounded-xl bg-[#faf7ff] hover:bg-color5 text-[#140d2b] border-2 border-[#decff7] transition cursor-pointer"
                        title="Próximo mês"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cabeçalho dos dias da semana */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                      <div key={d} className="text-[11px] font-extrabold uppercase text-[#6e6294] py-1">
                        {d}
                      </div>
                    ))}
                  </div>

                  {/* Dias do mês */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="h-11 rounded-xl" />
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const dayNum = idx + 1;
                      const iso = `${calendarYear}-${String(calendarMonthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const isSelected = selectedCalendarDate === iso;
                      const isToday = todayIso === iso;
                      const examsOnDay = scheduledExams.filter((e) => e.examDate === iso);
                      const hasExam = examsOnDay.length > 0;

                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => {
                            setSelectedCalendarDate(iso);
                            setSaveSuccessMsg(null);
                          }}
                          className={`h-11 rounded-xl flex flex-col items-center justify-center relative font-bold text-xs transition cursor-pointer border-2 ${
                            isSelected
                              ? 'bg-color1 text-white border-[#140d2b] shadow-[2px_2px_0px_#140d2b] scale-105 z-10'
                              : hasExam
                              ? 'bg-[#f3ecff] text-color1 border-color2 hover:bg-color5/70'
                              : isToday
                              ? 'bg-amber-50 text-[#140d2b] border-amber-400'
                              : 'bg-[#faf7ff] text-[#261c42] border-transparent hover:border-[#cbbdf0] hover:bg-white'
                          }`}
                        >
                          <span>{dayNum}</span>
                          {hasExam && (
                            <span
                              className={`w-4 h-1.5 rounded-full mt-0.5 ${
                                isSelected ? 'bg-amber-300' : 'bg-color1'
                              }`}
                              title={`${examsOnDay.length} prova(s) agendada(s)`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#f0e8ff] flex items-center justify-between text-[11px] text-[#5e5282] font-semibold">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-color1 inline-block" />
                      Dia com prova agendada
                    </span>
                    <span>Data selecionada: <strong className="text-color1">{formatDateBR(selectedCalendarDate)}</strong></span>
                  </div>
                </div>

                {/* Lista de Provas Agendadas */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-[#140d2b]/15 shadow-[0_10px_30px_-12px_rgba(20,13,43,0.12)]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-editorial text-lg font-bold text-[#140d2b] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-color1" />
                      Provas na Agenda ({scheduledExams.length})
                    </h3>
                  </div>

                  {scheduledExams.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#faf7ff] border-2 border-dashed border-[#cbbdf0] text-center">
                      <CalendarIcon className="w-8 h-8 text-color2 mx-auto mb-2 opacity-80" />
                      <p className="text-sm font-bold text-[#140d2b]">
                        Nenhuma prova agendada ainda
                      </p>
                      <p className="text-xs text-[#5e5282] mt-1">
                        Escolha o dia no calendário acima e preencha os conteúdos ao lado para já deixar tudo pronto para o dia da prova!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {scheduledExams.map((exam) => {
                        const countdown = getDaysRemainingLabel(exam.examDate);
                        return (
                          <div
                            key={exam.id}
                            className="p-4 rounded-2xl bg-[#faf7ff] border-2 border-[#decff7] hover:border-color1 transition space-y-3"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-color1 text-white">
                                    {formatDateBR(exam.examDate)}
                                  </span>
                                  <span
                                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                      countdown.urgent
                                        ? 'bg-amber-300 text-[#140d2b]'
                                        : 'bg-white text-[#4a3e6d] border border-[#cbbdf0]'
                                    }`}
                                  >
                                    {countdown.text}
                                  </span>
                                  {exam.savedQuestions && exam.savedQuestions.length > 0 && (
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                                      ⚡ {exam.savedQuestions.length} questões prontas
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-base text-[#140d2b]">
                                  {exam.title}
                                </h4>
                                {exam.pdfFileName && (
                                  <p className="text-xs font-semibold text-color1 mt-0.5 flex items-center gap-1">
                                    <FileCheck2 className="w-3.5 h-3.5" />
                                    PDF anexado: {exam.pdfFileName}
                                  </p>
                                )}
                                {exam.description && (
                                  <p className="text-xs text-[#4a3e6d] mt-1 line-clamp-2">
                                    {exam.description}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => deleteScheduledExam(exam.id)}
                                title="Excluir prova da agenda"
                                className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e9defc]">
                              <button
                                type="button"
                                disabled={isGenerating}
                                onClick={() => startScheduledExamQuiz(exam, false)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-color1 hover:bg-color2 text-white text-xs font-extrabold transition shadow-[2px_2px_0px_#140d2b] cursor-pointer disabled:opacity-50"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                {exam.savedQuestions?.length ? 'Abrir Quiz da Prova' : 'Gerar & Fazer Quiz'}
                              </button>
                              <button
                                type="button"
                                disabled={isGenerating}
                                onClick={() => startScheduledExamQuiz(exam, true)}
                                className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl bg-white hover:bg-color5/50 text-color1 border-2 border-[#cbbdf0] text-xs font-bold transition cursor-pointer disabled:opacity-50"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Novas Questões
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* COLUNA DIREITA (7 cols): Formulário para Anexar Prova + Conteúdos na Data Escolhida */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#140d2b]/15 shadow-[0_10px_30px_-12px_rgba(20,13,43,0.12)]">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b-2 border-[#f0e8ff]">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-color1 bg-color5/80 px-3 py-1 rounded-full">
                      <CalendarIcon className="w-3.5 h-3.5" />
                      Agendando para: {formatDateBR(selectedCalendarDate)}
                    </span>
                    <h3 className="font-editorial text-xl sm:text-2xl font-bold text-[#140d2b] mt-2">
                      Anexar Prova & Conteúdos no Calendário
                    </h3>
                  </div>

                  {/* Seletor rápido de data também em input nativo caso queira digitar */}
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#6e6294] mb-1">
                      Data da Prova
                    </label>
                    <input
                      type="date"
                      value={selectedCalendarDate}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedCalendarDate(e.target.value);
                          const [y, m] = e.target.value.split('-').map(Number);
                          if (y && m) setCalendarMonth({ year: y, month: m - 1 });
                        }
                      }}
                      className="px-3 py-2 rounded-xl border-2 border-[#cbbdf0] bg-[#faf7ff] text-[#140d2b] font-bold text-xs focus:outline-none focus:border-color1 cursor-pointer"
                    />
                  </div>
                </div>

                {saveSuccessMsg && (
                  <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>{saveSuccessMsg}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={(e) => handleGenerateQuiz(e)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-extrabold text-[#140d2b] mb-2">
                      1. Nome da Matéria, Prova ou Filósofo/Autor
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: P1 de Psicopatologia, Prova de Nietzsche, TCC, Psicanálise..."
                      value={subjectTitle}
                      onChange={(e) => setSubjectTitle(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#cbbdf0] bg-[#faf7ff] text-[#140d2b] font-semibold placeholder:text-[#6e6294] placeholder:font-normal focus:bg-white focus:outline-none focus:ring-4 focus:ring-color3/25 focus:border-color1 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-[#140d2b] mb-2">
                      2. O que o professor disse que vai cair? <span className="text-xs font-semibold text-color1 bg-color5 px-2 py-0.5 rounded-md ml-1">Sem resumo? Só descreva!</span>
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Ex: A prova vai cobrar Vontade de Potência, Ressentimento, Amor Fati em Nietzsche, ou os capítulos 1 a 4 dos slides..."
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                      className="w-full p-4 rounded-2xl border-2 border-[#cbbdf0] bg-[#faf7ff] text-[#140d2b] font-medium placeholder:text-[#6e6294] focus:bg-white focus:outline-none focus:ring-4 focus:ring-color3/25 focus:border-color1 text-sm leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <label className="block text-sm font-extrabold text-[#140d2b]">
                        3. Anexar PDF da Faculdade ou Resumo <span className="text-xs font-normal text-[#6e6294]">(Opcional)</span>
                      </label>
                      <label className="text-xs text-white bg-color1 hover:bg-color2 font-bold cursor-pointer flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition shadow-[2px_2px_0px_#140d2b]">
                        <UploadCloud className="w-4 h-4" />
                        Subir PDF da Aula (.pdf ou .txt)
                        <input type="file" accept=".pdf,.txt,application/pdf" onChange={handleFileUpload} className="hidden" />
                      </label>
                    </div>

                    {pdfFileName && (
                      <div className="flex items-center justify-between gap-3 p-3.5 mb-3 rounded-2xl bg-[#f3ecff] border-2 border-color1 text-[#140d2b]">
                        <div className="flex items-center gap-3 min-w-0">
                          <FileCheck2 className="w-6 h-6 text-color1 shrink-0" />
                          <div className="truncate">
                            <p className="text-[11px] font-extrabold text-color1 uppercase tracking-wider">
                              PDF anexado para esta prova
                            </p>
                            <p className="text-sm font-bold truncate">{pdfFileName}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearAttachedPdf}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remover
                        </button>
                      </div>
                    )}

                    <textarea
                      rows={3}
                      placeholder="Se quiser colar anotações de aula ou trechos extras além do PDF, cole aqui..."
                      value={summaryText}
                      onChange={(e) => setSummaryText(e.target.value)}
                      className="w-full p-4 rounded-2xl border-2 border-[#cbbdf0] bg-[#faf7ff] text-[#140d2b] font-medium placeholder:text-[#6e6294] focus:bg-white focus:outline-none focus:ring-4 focus:ring-color3/25 focus:border-color1 text-sm leading-relaxed"
                    />
                  </div>

                  <div className="pt-3 border-t-2 border-[#f0e8ff] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="text-xs font-extrabold uppercase tracking-wider text-[#4a3e6d]">
                        Quantidade de Questões do Simulado:
                      </label>
                      <select
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                        className="px-4 py-2 rounded-xl border-2 border-[#cbbdf0] bg-white text-[#140d2b] font-bold text-sm focus:outline-none focus:border-color1 cursor-pointer"
                      >
                        <option value={3}>3 Questões rápidas</option>
                        <option value={5}>5 Questões (Padrão)</option>
                        <option value={8}>8 Questões aprofundadas</option>
                        <option value={10}>10 Questões (Simulado completo)</option>
                      </select>
                    </div>

                    {/* Botões de Ação: Agendar para o Dia vs Fazer Agora */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        disabled={isGenerating}
                        onClick={() => handleScheduleExam(true)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm text-white bg-color1 hover:bg-color2 disabled:opacity-50 transition shadow-[4px_4px_0px_#140d2b] cursor-pointer"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Salvando e Preparando Quiz...
                          </>
                        ) : (
                          <>
                            <CalendarIcon className="w-4 h-4 text-color5" />
                            Agendar para {formatDateBR(selectedCalendarDate)} (Já Deixar Quiz Pronto)
                          </>
                        )}
                      </button>

                      <button
                        type="submit"
                        disabled={isGenerating}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm text-[#140d2b] bg-color5 hover:bg-color4 border-2 border-[#140d2b] disabled:opacity-50 transition shadow-[3px_3px_0px_#140d2b] cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-color1" />
                        Gerar e Treinar Agora Mesmo
                      </button>
                    </div>
                  </div>

                  {genError && (
                    <div className="p-4 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-bold">
                      {genError}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TUTOR IA & DÚVIDAS */}
        {activeTab === 'tutor' && (
          <div className="max-w-4xl mx-auto flex flex-col h-[680px] bg-white rounded-3xl border-2 border-[#140d2b]/20 shadow-[0_12px_35px_-12px_rgba(20,13,43,0.18)] overflow-hidden">
            {/* Chat header */}
            <div className="px-6 py-4 bg-[#1b113a] text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-color1 border-2 border-color4 flex items-center justify-center shadow-xs">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-editorial font-bold text-white text-base sm:text-lg">
                    Preceptor de Psicologia da Malu
                  </h3>
                  <p className="text-xs text-color4 font-medium">
                    Tire dúvidas de autores, peça exemplos clínicos e referências para a prova
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={getPhotoUrl(42)}
                  alt="Paulo e Malu"
                  className="hidden sm:block w-9 h-9 rounded-full object-cover border-2 border-color4"
                />
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Gemini 3.8 Ativo
                </span>
              </div>
            </div>

            {/* Chat history */}
            <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#faf7ff]">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-9 h-9 rounded-xl bg-[#1b113a] text-color5 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl p-4 sm:p-5 text-sm sm:text-base leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-color1 text-white font-medium rounded-br-xs shadow-[3px_3px_0px_#140d2b]'
                        : 'bg-white text-[#140d2b] rounded-bl-xs border-2 border-[#dfd5f7] shadow-xs whitespace-pre-wrap'
                    }`}
                  >
                    {msg.content || (
                      <span className="inline-flex items-center gap-2 text-xs font-semibold text-[#4a3e6d]">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-color1" />
                        Pensando...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Prompts */}
            <div className="px-6 py-3 border-t-2 border-[#efe8ff] bg-[#f4edff] flex items-center gap-2 overflow-x-auto text-xs">
              <span className="text-[#3b3054] shrink-0 font-extrabold uppercase tracking-wider text-[11px]">
                Perguntar rápido:
              </span>
              <button
                onClick={() => handleSendMessage('Pode me explicar os conceitos de Vontade de Potência e Ressentimento em Nietzsche e como se articulam com a Psicologia?')}
                className="px-3 py-1.5 rounded-xl bg-white border-2 border-[#cbbdf0] text-[#140d2b] font-semibold hover:bg-color1 hover:text-white hover:border-color1 shrink-0 transition cursor-pointer"
              >
                Nietzsche na Psicologia
              </button>
              <button
                onClick={() => handleSendMessage('Qual a diferença entre reforço negativo e punição positiva de acordo com Skinner?')}
                className="px-3 py-1.5 rounded-xl bg-white border-2 border-[#cbbdf0] text-[#140d2b] font-semibold hover:bg-color1 hover:text-white hover:border-color1 shrink-0 transition cursor-pointer"
              >
                Reforço Negativo vs Punição
              </button>
              <button
                onClick={() => handleSendMessage('Como diferenciar um delírio de uma ideia sobrevalorada segundo Dalgalarrondo?')}
                className="px-3 py-1.5 rounded-xl bg-white border-2 border-[#cbbdf0] text-[#140d2b] font-semibold hover:bg-color1 hover:text-white hover:border-color1 shrink-0 transition cursor-pointer"
              >
                Delírio vs Ideia Sobrevalorada
              </button>
            </div>

            {/* Chat Input - High Contrast */}
            <div className="p-4 sm:p-5 border-t-2 border-[#dfd5f7] bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  placeholder="Pergunte sobre Nietzsche, Freud, TCC, DSM-5 ou tire dúvidas da prova..."
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  className="flex-1 px-4 py-3.5 rounded-2xl border-2 border-[#b7a3eb] bg-[#faf7ff] text-[#140d2b] font-semibold placeholder:text-[#6e6294] placeholder:font-normal focus:bg-white focus:outline-none focus:ring-4 focus:ring-color3/30 focus:border-color1 text-sm sm:text-base"
                />
                <button
                  type="submit"
                  disabled={!inputQuestion.trim() || isChatLoading}
                  className="px-5 h-12 rounded-2xl bg-color1 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-color2 disabled:opacity-40 transition shadow-[3px_3px_0px_#140d2b] cursor-pointer shrink-0"
                >
                  <span>Enviar</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Discreet Scrapbook Strip at the bottom of the page */}
        <section className="mt-10 pt-6 border-t-2 border-[#140d2b]/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#4a3e6d] flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 fill-color1 text-color1" />
              Cantinho de Inspiração • Nossos Momentos
            </p>
            <button
              type="button"
              onClick={shufflePhotos}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-color1 hover:text-color2 bg-color5/60 hover:bg-color5 px-3 py-1 rounded-xl border border-color4 transition cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              Ver outras lembranças nossas ({TOTAL_COUPLE_PHOTOS} fotos)
            </button>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[2, 11, 21, 35, 46, 58].map((offset, idx) => (
              <div
                key={idx}
                onClick={shufflePhotos}
                title="Clique para trocar as fotos 💜"
                className={`group bg-white p-1.5 pb-3 rounded-2xl border-2 border-[#dfd5f7] shadow-xs hover:shadow-md hover:border-color2 transition-all cursor-pointer ${
                  idx % 2 === 0 ? '-rotate-1 hover:rotate-0' : 'rotate-1 hover:rotate-0'
                }`}
              >
                <div className="aspect-square rounded-xl overflow-hidden bg-[#faf7ff]">
                  <img
                    src={getPhotoUrl(offset)}
                    alt="Paulo e Malu"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t-2 border-[#140d2b]/10 bg-white py-5 text-center text-xs text-[#4a3e6d] font-medium">
        <p className="flex items-center justify-center gap-1.5">
          Feito com muito carinho por <strong className="text-[#140d2b] font-extrabold">Paulo</strong> para a futura psicóloga <strong className="text-color1 font-extrabold">Malu</strong> 💜
        </p>
      </footer>
    </div>
  );
}
