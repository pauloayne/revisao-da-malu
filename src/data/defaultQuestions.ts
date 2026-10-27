import { Question } from '../types/quiz';

export const DEFAULT_QUESTIONS: Record<string, Question[]> = {
  "Geral": [
    {
      id: "q1",
      question: "Qual mecanismo de defesa freudiano consiste em redirecionar impulsos inaceitáveis para canais socialmente produtivos e valorizados?",
      options: [
        "Repressão",
        "Sublimação",
        "Projeção",
        "Racionalização"
      ],
      correctAnswer: 1,
      explanation: "A sublimação canaliza a energia de pulsões inconscientes (como impulsos sexuais ou agressivos) para atividades socialmente aceitas e criativas, como a arte, o trabalho científico ou a literatura.",
      psychologySource: "Freud, S. (1915). Os Instintos e suas Vicissitudes."
    },
    {
      id: "q2",
      question: "No Behaviorismo Operante de B. F. Skinner, o que caracteriza o 'Reforço Negativo'?",
      options: [
        "Aplicação de um estímulo aversivo para extinguir um comportamento.",
        "Retirada de um estímulo agradável após uma conduta inadequada.",
        "Remoção ou atenuação de um estímulo aversivo, aumentando a probabilidade da resposta se repetir.",
        "Falta de qualquer consequência após a emissão da resposta do sujeito."
      ],
      correctAnswer: 2,
      explanation: "Lembre-se: 'Reforço' sempre aumenta a probabilidade do comportamento se repetir. No 'Negativo', ele aumenta o comportamento através da retirada/remoção de um estímulo desagradável (ex: tomar remédio para retirar a dor de cabeça).",
      psychologySource: "Skinner, B. F. (1953). Ciência e Comportamento Humano."
    },
    {
      id: "q3",
      question: "De acordo com Jean Piaget, em qual estágio do desenvolvimento cognitivo a criança desenvolve a noção de 'permanência do objeto'?",
      options: [
        "Estágio Sensório-motor (0 a 2 anos)",
        "Estágio Pré-operatório (2 a 7 anos)",
        "Estágio Operatório Concreto (7 a 11 anos)",
        "Estágio Operatório Formal (12 anos em diante)"
      ],
      correctAnswer: 0,
      explanation: "A permanência do objeto (entender que coisas continuam existindo mesmo fora do campo de visão) é consolidada durante o estágio sensório-motor, tipicamente por volta dos 8-9 meses.",
      psychologySource: "Piaget, J. (1936). As Origens da Inteligência na Criança."
    },
    {
      id: "q4",
      question: "Segundo Lev Vygotsky, a 'Zona de Desenvolvimento Proximal' (ZDP) representa:",
      options: [
        "A distância entre o que o indivíduo já faz sozinho e o que consegue fazer com mediação ou auxílio.",
        "O limite biológico neurológico imutável da aprendizagem humana.",
        "A capacidade máxima de memorização de estímulos visuais na infância.",
        "O período em que a linguagem interna ainda não se desenvolveu."
      ],
      correctAnswer: 0,
      explanation: "A ZDP é o espaço dinâmico entre o nível de desenvolvimento real (resolver sozinho) e o nível de desenvolvimento potencial (resolver sob orientação ou em colaboração com outros).",
      psychologySource: "Vygotsky, L. S. (1978). A Formação Social da Mente."
    },
    {
      id: "q5",
      question: "Na Psicopatologia, qual é a principal diferença conceitual entre Alucinação e Ilusão?",
      options: [
        "A alucinação é um erro no juízo de realidade, enquanto a ilusão é apenas uma alteração do afeto.",
        "A alucinação é uma percepção sem objeto real, enquanto a ilusão é uma percepção distorcida ou deformada de um objeto real existente.",
        "A alucinação ocorre apenas no sono REM, e a ilusão ocorre na vigília.",
        "Não há diferença clínica, ambos são sinônimos de delírio."
      ],
      correctAnswer: 1,
      explanation: "Alucinação é a percepção clara na ausência de qualquer estímulo sensorial externo correspondente ('ouvir vozes sem ninguém falando'). Já a Ilusão envolve um objeto real mal interpretado (ver um casaco no escuro e achar momentaneamente que é uma pessoa).",
      psychologySource: "Dalgalarrondo, P. (2018). Psicopatologia e Semiologia dos Transtornos Mentais."
    }
  ]
};
