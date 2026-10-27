import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { messages, context, pdfBase64, pdfFileName } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chave GEMINI_API_KEY não configurada no ambiente.' },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `Você é o Tutor de Psicologia da plataforma "Revisão da Malu", carinhoso, didático e com profundo embasamento científico em Psicologia (Psicanálise, TCC, Behaviorismo, Psicopatologia, Neuropsicologia, Desenvolvimento Humano, Filosofia aplicada à Psicologia como Nietzsche, Foucault, etc.).
O site foi feito com amor pelo namorado dela, Paulo, para apoiá-la na graduação de Psicologia.

Suas diretrizes:
1. Responda de forma ágil, clara, empática e com rigor acadêmico.
2. Explique conceitos com exemplos clínicos diretos.
3. Se ela perguntar o porquê de ter errado ou acertado uma questão, vá direto ao ponto explicando a alternativa certa e a pegadinha.
4. Cite obras de referência, manuais ou autores clássicos (ex: Dalgalarrondo, Beck, Freud, Piaget, Vygotsky, Skinner, Nietzsche, Kaplan, DSM-5-TR, etc.).
5. Incentive-a em sua jornada para se tornar uma psicóloga brilhante!

${pdfFileName ? `A aluna anexou o PDF da faculdade "${pdfFileName}", que está disponível na conversa.` : ''}
${context ? `Contexto da revisão atual ou resumo da aluna:\n"""\n${context}\n"""` : ''}`;

    const conversationHistory = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === 'assistant' ? 'Tutor' : 'Malu'}: ${m.content}`
      )
      .join('\n\n');

    const inputPayload = pdfBase64
      ? [
          { type: 'text' as const, text: conversationHistory },
          {
            type: 'document' as const,
            data: pdfBase64,
            mime_type: 'application/pdf' as const
          }
        ]
      : conversationHistory;

    const stream = await ai.interactions.create({
      model: 'gemini-3.8-flash',
      input: inputPayload,
      system_instruction: systemInstruction,
      generation_config: {
        thinking_level: 'low'
      },
      stream: true
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.event_type === 'step.delta' && event.delta?.type === 'text') {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err: any) {
          controller.enqueue(encoder.encode(`\n\n[Erro na transmissão: ${err?.message || 'falha inesperada'}]`));
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      }
    });
  } catch (error: any) {
    console.error('Erro no assistente de IA:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao consultar o tutor de IA.' },
      { status: 500 }
    );
  }
}
