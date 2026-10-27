export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  psychologySource?: string;
}

export interface QuizSession {
  title: string;
  subject: string;
  questions: Question[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  timestamp: string;
}

export interface ScheduledExam {
  id: string;
  title: string;
  examDate: string; // YYYY-MM-DD
  description: string;
  summaryText?: string;
  pdfBase64?: string | null;
  pdfFileName?: string | null;
  questionCount: number;
  savedQuestions?: Question[];
  lastScore?: number;
  createdAt: string;
}
