# Persona AI Chat

An AI-powered website that simulates coding conversations in the public teaching styles of Hitesh Choudhary and Piyush Garg. The app uses a React chat UI, an Express API, and the OpenAI Responses API from the server so the API key is not exposed to the browser.

This is a style simulation for learning and evaluation. It does not claim to be the real Hitesh Choudhary or Piyush Garg.

## Features

- Persona switcher for Hitesh Choudhary and Piyush Garg
- LLM-backed chat endpoint with persona-specific prompt layers
- Recent-history context and compact older-context handling
- Markdown/code rendering in responses
- Loading, error, retry, clear-chat, and starter-prompt states
- Production Express server that serves the built Vite app

## Tech Stack

- Vite + React + TypeScript
- Express + TypeScript
- OpenAI Node SDK
- React Markdown
- Lucide React icons

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from the example:

```bash
cp .env.example .env
```

3. Add your OpenAI key:

```bash
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-5.5
PORT=3001
```

4. Run the development servers:

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API calls to the Express server on `http://localhost:3001`.

## Production Build

```bash
npm run build
npm start
```

The Express server serves the built frontend from `dist`.

## Render Deployment

Create a new Render Web Service from the public GitHub repository.

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variables:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL` optional, defaults to `gpt-5.5`
  - `NODE_ENV=production`

Render provides `PORT` automatically.

## API

`POST /api/chat`

```json
{
  "personaId": "hitesh",
  "message": "Explain promises in JavaScript",
  "history": [
    { "role": "user", "content": "I am learning async JS" },
    { "role": "assistant", "content": "Great, let's start with callbacks..." }
  ],
  "previousResponseId": "resp_..."
}
```

Response:

```json
{
  "text": "Generated persona response",
  "previousResponseId": "resp_..."
}
```

## Documentation

- [Persona research](docs/persona-research.md)
- [Prompting strategy](docs/prompting-strategy.md)
- [Sample conversations](docs/sample-conversations.md)

## Verification

```bash
npm run typecheck
npm run build
```
