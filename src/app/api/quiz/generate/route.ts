import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { summary, topic, count = 5 } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave GEMINI_API_KEY não configurada no ambiente.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Você é um professor universitário e preceptor experiente de Psicologia.
Seu objetivo é criar um quiz de fixação de alto nível para a estudante de Psicologia 'Malu'.

${topic ? `TEMA/DISCIPLINA: ${topic}` : ''}
${summary ? `RESUMO / TEXTO BASE FORNECIDO PELA ESTUDANTE:\n"""\n${summary}\n"""` : ''}

Gere exatamente ${count} questões de múltipla escolha pertinentes, focadas em raciocínio clínico, conceitos teóricos fundamentais e autores de psicologia.
Para cada questão forneça 4 alternativas (apenas 1 correta), o índice da alternativa correta (0, 1, 2 ou 3), uma explicação detalhada e pedagógica de por que aquela é a correta e por que as outras estão incorretas, e cite a fonte/autor de referência da psicologia acadêmica (ex: Dalgalarrondo, Freud, Skinner, DSM-5-TR, Rogers, Vigotski, etc.).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          description: "Lista de questões do quiz de psicologia",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              question: { type: Type.STRING, description: "O enunciado completo da questão" },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exatamente 4 opções de resposta"
              },
              correctAnswer: { type: Type.INTEGER, description: "Índice da resposta certa (0, 1, 2 ou 3)" },
              explanation: { type: Type.STRING, description: "Explicação minuciosa explicando o acerto e os erros conceituais das alternativas" },
              psychologySource: { type: Type.STRING, description: "Fonte teórica, livro clássico, manual ou autor de psicologia" }
            },
            required: ["id", "question", "options", "correctAnswer", "explanation", "psychologySource"]
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || '[]');
    return NextResponse.json({ questions: parsedData });
  } catch (error: any) {
    console.error('Erro ao gerar quiz:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao processar solicitação com a IA.' },
      { status: 500 }
    );
  }
}
