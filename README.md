# ICQA Tracker — Guia de Deploy

Aplicativo para acompanhamento de desenvolvimento dos reps de ICQA por turno e tarefa.

---

## 🚀 Publicar na web em 5 minutos (Vercel — gratuito)

### Pré-requisitos
- Conta gratuita em [vercel.com](https://vercel.com) (pode entrar com Google ou GitHub)
- [Node.js](https://nodejs.org) instalado no computador (versão 18 ou superior)

---

### Opção A — Deploy pelo terminal (mais rápido)

```bash
# 1. Entre na pasta do projeto
cd icqa-app

# 2. Instale as dependências
npm install

# 3. Instale o CLI do Vercel
npm install -g vercel

# 4. Faça o deploy (vai pedir login na primeira vez)
vercel --prod
```

Pronto! O Vercel vai gerar uma URL pública como:
`https://icqa-tracker-seuusuario.vercel.app`

---

### Opção B — Deploy pelo GitHub (recomendado para atualizações contínuas)

1. Crie um repositório no [github.com](https://github.com)
2. Faça upload de todos os arquivos desta pasta
3. Acesse [vercel.com/new](https://vercel.com/new)
4. Clique em **"Import Git Repository"** e selecione o repositório
5. Clique em **Deploy** — o Vercel detecta o Vite automaticamente

A partir daí, toda vez que você atualizar o repositório, o site é republicado automaticamente.

---

### Opção C — Netlify (alternativa gratuita)

```bash
# 1. Instale as dependências e gere o build
npm install
npm run build

# 2. Instale o CLI do Netlify
npm install -g netlify-cli

# 3. Deploy
netlify deploy --prod --dir=dist
```

---

## 🛠️ Rodar localmente (para testar antes de publicar)

```bash
npm install
npm run dev
```

Acesse: `http://localhost:5173`

---

## 📁 Estrutura do projeto

```
icqa-app/
├── index.html          # Entrada HTML
├── package.json        # Dependências
├── vite.config.js      # Configuração do Vite
└── src/
    ├── main.jsx        # Ponto de entrada React
    └── App.jsx         # Aplicativo completo
```

---

## 📊 Como importar dados da planilha

1. No Excel/Google Sheets, exporte cada aba de turno como **CSV**
2. No app, clique em **"Importar planilha"**
3. Faça o upload do CSV
4. Mapeie as colunas para os campos (Nome, Contagem, Inbound Audit, etc.)
5. Confirme a importação

**Formato esperado:**
```
Nome,Contagem,Inbound Audit,Stock Audit,Lost,Transfer,Lost/Sobra
Ana Lima,85,72,90,65,78,88
Bruno Souza,60,55,70,80,45,72
```

---

## ❓ Dúvidas frequentes

**O aplicativo salva os dados?**
Por enquanto os dados ficam na memória da sessão. Se precisar de persistência entre sessões, podemos adicionar salvamento em banco de dados (Supabase/Firebase).

**Posso personalizar os turnos ou tarefas?**
Sim — edite as constantes `TURNOS` e `TAREFAS` no arquivo `src/App.jsx`.

**Preciso de domínio próprio?**
Não, o Vercel fornece um domínio `.vercel.app` gratuitamente. Domínio personalizado também é suportado.
