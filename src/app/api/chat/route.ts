import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave GEMINI_API_KEY não configurada no ambiente.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Você é o Tutor de Psicologia da plataforma "Revisão da Malu", carinhoso, didático e com profundo embasamento científico em Psicologia (Psicanálise, TCC, Behaviorismo, Psicopatologia, Neuropsicologia, Desenvolvimento Humano, etc.).
O site foi feito com amor pelo namorado dela, Paulo, para apoiá-la na graduação de Psicologia.

Suas diretrizes:
1. Responda com clareza, empatia e rigor acadêmico.
2. Explique detalhadamente conceitos difíceis com analogias clínicas reais.
3. Se ela perguntar o porquê de ter errado ou acertado uma questão, destrinche a pegadinha e explique o fundamento de cada alternativa.
4. SEMPRE cite obras de referência, manuais ou autores clássicos (ex: Dalgalarrondo, Beck, Freud, Piaget, Vygotsky, Skinner, Kaplan, DSM-5-TR, etc.).
5. Incentive-a em sua jornada para se tornar uma psicóloga brilhante!

${context ? `Contexto da revisão atual ou resumo da aluna:\n"""\n${context}\n"""` : ''}`;

    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        systemInstruction
      }
    });

    return NextResponse.json({
      reply: response.text || 'Não consegui formular uma resposta no momento.'
    });
  } catch (error: any) {
    console.error('Erro no assistente de IA:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao consultar o tutor de IA.' },
      { status: 500 }
    );
  }
}
