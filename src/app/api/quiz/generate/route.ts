import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { summary, topic, description, pdfBase64, pdfFileName, count = 5 } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave GEMINI_API_KEY não configurada no ambiente.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Você é um professor universitário e preceptor experiente de Psicologia e Filosofia aplicada à Psicologia.
Seu objetivo é criar um quiz de fixação inédito, criativo e de alto nível para a estudante de Psicologia 'Malu'.

${topic ? `TEMA / ASSUNTO PESQUISADO: ${topic}` : ''}
${pdfFileName ? `ARQUIVO PDF DA FACULDADE ANEXADO: ${pdfFileName} (leia atentamente o documento em anexo)` : ''}
${description ? `FOCO DA PROVA / DESCRIÇÃO DO QUE VAI CAIR:\n"""\n${description}\n"""` : ''}
${summary ? `RESUMO / TEXTO BASE FORNECIDO PELA ESTUDANTE:\n"""\n${summary}\n"""` : ''}

INSTRUÇÕES IMPORTANTES:
- Se houver um arquivo PDF anexado ou resumo em texto, baseie as questões fortemente no conteúdo desse material da faculdade.
- Se a estudante NÃO anexou PDF/resumo e apenas pesquisou um tema/autor (ex: Nietzsche, Freud, Vigotski, TCC, Psicopatologia) ou descreveu o que vai cair na prova, gere questões acadêmicas excelentes sobre esse tema e foco específico.
- Gere questões variadas e objetivas (casos clínicos curtos, situações-problema e conceitos teóricos) para que cada vez que ela gere um quiz sobre o tema, venham perguntas novas (Semente: ${Date.now()}).
- Gere exatamente ${count} questões de múltipla escolha pertinentes.
- Para cada questão forneça 4 alternativas (apenas 1 correta), o índice da alternativa correta (0, 1, 2 ou 3), uma explicação direta e didática (2 a 3 frases) de por que aquela é a correta, e cite a fonte/autor/obra de referência (ex: Nietzsche - Genealogia da Moral, Dalgalarrondo, Freud, Skinner, DSM-5-TR, etc.).`;

    const inputPayload = pdfBase64
      ? [
          { type: 'text' as const, text: prompt },
          {
            type: 'document' as const,
            data: pdfBase64,
            mime_type: 'application/pdf' as const
          }
        ]
      : prompt;

    const interaction = await ai.interactions.create({
      model: pdfBase64 ? 'gemini-3.8-flash' : 'gemini-3.5-flash-lite',
      input: inputPayload,
      generation_config: {
        thinking_level: pdfBase64 ? 'low' : 'minimal'
      },
      response_format: {
        type: 'array',
        description: 'Lista de questões do quiz de psicologia',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            question: { type: 'string', description: 'O enunciado completo da questão' },
            options: {
              type: 'array',
              items: { type: 'string' },
              description: 'Exatamente 4 opções de resposta'
            },
            correctAnswer: { type: 'integer', description: 'Índice da resposta certa (0, 1, 2 ou 3)' },
            explanation: { type: 'string', description: 'Explicação minuciosa explicando o acerto e os erros conceituais das alternativas' },
            psychologySource: { type: 'string', description: 'Fonte teórica, livro clássico, manual ou autor de psicologia' }
          },
          required: ['id', 'question', 'options', 'correctAnswer', 'explanation', 'psychologySource']
        }
      }
    });

    const parsedData = JSON.parse(interaction.output_text || '[]');
    return NextResponse.json({ questions: parsedData });
  } catch (error: any) {
    console.error('Erro ao gerar quiz:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao processar solicitação com a IA.' },
      { status: 500 }
    );
  }
}
