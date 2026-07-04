import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { personas, type Persona, type PersonaId } from "../shared/personas.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const isProduction = process.env.NODE_ENV === "production";
const model = process.env.OPENAI_MODEL || "gpt-5.5";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(6000)
});

const chatRequestSchema = z.object({
  personaId: z.enum(["hitesh", "piyush"]),
  message: z.string().min(1).max(6000),
  history: z.array(chatMessageSchema).default([]),
  previousResponseId: z.string().optional().nullable()
});

type ChatMessage = z.infer<typeof chatMessageSchema>;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    model,
    hasApiKey: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.post("/api/chat", async (req, res) => {
  const parsed = chatRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid chat request.",
      details: parsed.error.flatten()
    });
  }

  if (!openai) {
    return res.status(503).json({
      error:
        "OPENAI_API_KEY is not configured. Add it to .env locally or to Render environment variables in production."
    });
  }

  const persona = personas[parsed.data.personaId as PersonaId];
  const instructions = buildInstructions(persona, parsed.data.history);
  const input = buildInput(parsed.data.message, parsed.data.history);
  const shouldUsePreviousResponse =
    Boolean(parsed.data.previousResponseId) && parsed.data.history.length <= 2;

  try {
    const response = await openai.responses.create({
      model,
      instructions,
      input,
      previous_response_id: shouldUsePreviousResponse
        ? parsed.data.previousResponseId || undefined
        : undefined,
      max_output_tokens: 900,
      metadata: {
        persona: persona.id
      }
    });

    const text = response.output_text?.trim();

    if (!text) {
      return res.status(502).json({
        error: "The model returned an empty response. Please retry."
      });
    }

    return res.json({
      text,
      previousResponseId: response.id
    });
  } catch (error) {
    console.error("OpenAI chat error", error);
    const message = getSafeProviderError(error);

    return res.status(500).json({
      error: message || "Unable to generate a persona response right now."
    });
  }
});

if (isProduction) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const distPath = path.resolve(__dirname, "../../dist");

  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Persona AI server listening on http://localhost:${port}`);
});

function buildInstructions(persona: Persona, history: ChatMessage[]) {
  const compactContext = summarizeOlderContext(history);

  return [
    "You are powering a student project called Persona AI Chat.",
    "You simulate a public teaching style inspired by a coding educator, but you must never claim to be the real person.",
    "Be helpful, technically accurate, and context-aware. If the user asks for private, current, or personal claims, state the limitation and answer from public persona notes only.",
    "Format answers with short paragraphs, bullets, and code blocks when useful.",
    "",
    `Selected persona: ${persona.name}`,
    `Public role: ${persona.role}`,
    `Persona summary: ${persona.bio}`,
    "",
    "Tone rules:",
    ...persona.toneRules.map((rule) => `- ${rule}`),
    "",
    "Teaching style:",
    ...persona.teachingStyle.map((rule) => `- ${rule}`),
    "",
    "Vocabulary and phrasing cues to use lightly, not mechanically:",
    ...persona.vocabularyCues.map((cue) => `- ${cue}`),
    "",
    "Boundaries:",
    ...persona.boundaries.map((boundary) => `- ${boundary}`),
    "",
    compactContext ? `Earlier conversation summary:\n${compactContext}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function buildInput(message: string, history: ChatMessage[]) {
  const recentTurns = history.slice(-8);
  const context = recentTurns
    .map((item) => `${item.role === "user" ? "User" : "Assistant"}: ${item.content}`)
    .join("\n\n");

  return context
    ? `${context}\n\nUser: ${message}`
    : `User: ${message}`;
}

function summarizeOlderContext(history: ChatMessage[]) {
  const olderTurns = history.slice(0, -8);

  if (olderTurns.length === 0) {
    return "";
  }

  return olderTurns
    .map((item) => {
      const label = item.role === "user" ? "User asked" : "Assistant replied";
      const compact = item.content.replace(/\s+/g, " ").slice(0, 220);
      return `- ${label}: ${compact}${item.content.length > 220 ? "..." : ""}`;
    })
    .join("\n");
}

function getSafeProviderError(error: unknown) {
  if (!error || typeof error !== "object") {
    return "";
  }

  const maybeError = error as {
    status?: number;
    message?: string;
    error?: { message?: string; type?: string; param?: string };
  };

  const providerMessage = maybeError.error?.message || maybeError.message || "";

  if (!providerMessage) {
    return "";
  }

  if (maybeError.status && maybeError.status >= 400 && maybeError.status < 500) {
    return `OpenAI rejected the request: ${providerMessage}`;
  }

  return providerMessage.includes("Connection error")
    ? "Could not reach OpenAI from the server. Check network access and try again."
    : "";
}
