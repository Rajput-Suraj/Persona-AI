import React from "react";
import ReactDOM from "react-dom/client";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Check,
  Code2,
  Eraser,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  User
} from "lucide-react";
import { personaList, personas, type PersonaId } from "../shared/personas";
import "./styles.css";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ChatState = {
  messages: ChatMessage[];
  previousResponseId?: string;
};

const initialChats: Record<PersonaId, ChatState> = {
  hitesh: { messages: [] },
  piyush: { messages: [] }
};

function App() {
  const [personaId, setPersonaId] = React.useState<PersonaId>("hitesh");
  const [chats, setChats] = React.useState<Record<PersonaId, ChatState>>(initialChats);
  const [draft, setDraft] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [lastUserMessage, setLastUserMessage] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const persona = personas[personaId];
  const activeChat = chats[personaId];

  const switchPersona = (nextPersonaId: PersonaId) => {
    setPersonaId(nextPersonaId);
    setError("");
    setDraft("");
  };

  const sendMessage = async (
    content = draft.trim(),
    options: { appendUser?: boolean; historyOverride?: ChatMessage[] } = {}
  ) => {
    if (!content || isLoading) {
      return;
    }

    const appendUser = options.appendUser ?? true;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content
    };

    const historySource = options.historyOverride ?? activeChat.messages;
    const history = historySource.map(({ role, content }) => ({ role, content }));
    setDraft("");
    setError("");
    setLastUserMessage(content);
    setIsLoading(true);

    if (appendUser) {
      setChats((current) => ({
        ...current,
        [personaId]: {
          ...current[personaId],
          messages: [...current[personaId].messages, userMessage]
        }
      }));
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId,
          message: content,
          history,
          previousResponseId: activeChat.previousResponseId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.text
      };

      setChats((current) => ({
        ...current,
        [personaId]: {
          messages: [...current[personaId].messages, assistantMessage],
          previousResponseId: data.previousResponseId
        }
      }));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to send message.");
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const clearActiveChat = () => {
    setChats((current) => ({
      ...current,
      [personaId]: { messages: [] }
    }));
    setError("");
    setLastUserMessage("");
  };

  const retryLastMessage = () => {
    if (!lastUserMessage) {
      return;
    }

    const lastMessage = activeChat.messages[activeChat.messages.length - 1];
    const historyOverride =
      lastMessage?.role === "user" && lastMessage.content === lastUserMessage
        ? activeChat.messages.slice(0, -1)
        : activeChat.messages;

    void sendMessage(lastUserMessage, { appendUser: false, historyOverride });
  };

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Persona selection">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <h1>Persona AI</h1>
            <p>LLM chat simulator</p>
          </div>
        </div>

        <div className="persona-list">
          {personaList.map((candidate) => (
            <button
              className={`persona-card ${personaId === candidate.id ? "active" : ""}`}
              key={candidate.id}
              onClick={() => switchPersona(candidate.id)}
              type="button"
            >
              <span className="avatar">{candidate.shortName.charAt(0)}</span>
              <span className="persona-copy">
                <strong>{candidate.name}</strong>
                <small>{candidate.role}</small>
              </span>
              {personaId === candidate.id ? <Check size={18} /> : null}
            </button>
          ))}
        </div>

        <section className="persona-brief">
          <div className="section-label">
            <Bot size={16} />
            Active style
          </div>
          <h2>{persona.accent}</h2>
          <p>{persona.bio}</p>
          <div className="cue-list">
            {persona.vocabularyCues.slice(0, 4).map((cue) => (
              <span key={cue}>{cue}</span>
            ))}
          </div>
        </section>
      </aside>

      <section className="chat-panel" aria-label={`${persona.name} chat`}>
        <header className="chat-header">
          <div>
            <p className="eyebrow">Simulated persona</p>
            <h2>{persona.name}</h2>
          </div>
          <button className="icon-button" onClick={clearActiveChat} title="Clear chat" type="button">
            <Eraser size={18} />
          </button>
        </header>

        <div className="messages" aria-live="polite">
          {activeChat.messages.length === 0 ? (
            <EmptyState personaId={personaId} onPrompt={sendMessage} />
          ) : (
            activeChat.messages.map((message) => (
              <article className={`message ${message.role}`} key={message.id}>
                <div className="message-icon">
                  {message.role === "user" ? <User size={17} /> : <Code2 size={17} />}
                </div>
                <div className="message-body">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </article>
            ))
          )}

          {isLoading ? (
            <article className="message assistant">
              <div className="message-icon">
                <Loader2 className="spin" size={17} />
              </div>
              <div className="message-body muted">Thinking in {persona.shortName}'s teaching style...</div>
            </article>
          ) : null}
        </div>

        {error ? (
          <div className="error-bar" role="alert">
            <span>{error}</span>
            <button onClick={retryLastMessage} type="button">
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        ) : null}

        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
        >
          <textarea
            aria-label="Message"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder={`Ask ${persona.shortName} about code, projects, or learning paths...`}
            ref={textareaRef}
            rows={3}
            value={draft}
          />
          <button disabled={!draft.trim() || isLoading} type="submit">
            {isLoading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
            Send
          </button>
        </form>
      </section>
    </main>
  );
}

function EmptyState({
  personaId,
  onPrompt
}: {
  personaId: PersonaId;
  onPrompt: (content: string) => Promise<void>;
}) {
  const persona = personas[personaId];

  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Bot size={26} />
      </div>
      <h2>Start a focused learning chat</h2>
      <p>
        Choose a prompt or ask your own question. This is a style simulation built from public
        teaching signals, not the real person.
      </p>
      <div className="starter-grid">
        {persona.starterPrompts.map((prompt) => (
          <button key={prompt} onClick={() => void onPrompt(prompt)} type="button">
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
