# Revisão da Malu 🧠💙

> *"Feito com amor para minha futura psicóloga. Ass: Paulo"*

Plataforma interativa de estudos e preparação para provas de Psicologia, desenvolvida para a Malu com tecnologia moderna e inteligência artificial (Google Gemini).

---

## ✨ Funcionalidades

1. **Quiz Interativo de Psicologia:**
   - Questões completas de múltipla escolha.
   - Feedback em tempo real com explicações teóricas detalhadas.
   - Citações de autores e manuais conceituados (Dalgalarrondo, Freud, Skinner, Piaget, Vygotsky, DSM-5-TR, Beck).
   - Animação de confetes para acertos e fechamento do quiz.

2. **Personalização & Anexo de Resumos:**
   - Permite que a Malu cole anotações de aulas, resumos de matérias ou carregue arquivos de texto (`.txt`).
   - A IA formula automaticamente simulados sob medida focados na matéria da prova.

3. **Tutor IA & Tirador de Dúvidas (Gemini):**
   - Chatbot pedagógico e carinhoso com conhecimento aprofundado em Psicologia.
   - Botão direto dentro do quiz: *"Tirar dúvida com a IA sobre esta questão"*, explicando pegadinhas e alternativas erradas.

---

## 🚀 Como testar localmente

1. Entre na pasta:
   ```bash
   cd C:\Users\Pichau\revisao-da-malu
   ```

2. Crie o arquivo `.env.local` e insira sua chave gratuita do Google Gemini:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   ```
   *(Você pode gerar sua chave gratuitamente em: https://aistudio.google.com/)*

3. Inicie o servidor local:
   ```bash
   npm.cmd run dev
   ```
   Acesse no navegador: `http://localhost:3000`

---

## 🌐 Como colocar na Vercel (100% Grátis)

### Opção 1: Via GitHub (Recomendado)
1. Crie um repositório no seu GitHub (ex: `revisao-da-malu`).
2. Suba o código:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/revisao-da-malu.git
   git branch -M main
   git push -u origin main
   ```
3. Acesse [vercel.com](https://vercel.com) e clique em **"Add New Project"** > **"Import Git Repository"**.
4. Em **Environment Variables**, adicione:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** *sua chave do Google AI Studio*
5. Clique em **Deploy**! Em 1 minuto o site estará no ar num link como `revisao-da-malu.vercel.app` para ela acessar do celular ou notebook.

### Opção 2: Pelo Terminal via Vercel CLI
```bash
cd C:\Users\Pichau\revisao-da-malu
npx.cmd vercel
```
Siga os passos rápidos na tela e adicione a variável de ambiente `GEMINI_API_KEY`.
