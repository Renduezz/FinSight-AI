"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, History, Trash2, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { preguntarIA } from "@/features/assistant/services/assistantApi";
import { useToast } from "@/shared/components/Toast";
import { useLanguage } from "@/shared/context/LanguageContext";
import { useAuth } from "@/shared/context/AuthContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// El historial se guarda en el navegador, separado por usuario, y se conserva
// aunque cierres la pestaña o la sesión.
const HISTORY_KEY_PREFIX = "finsight_chat_history_";
const MAX_SAVED_MESSAGES = 200;
const OPEN_KEY = "finsight_chat_open";

// El contenido del mensaje de bienvenida se toma del idioma activo al renderizar.
const WELCOME_MESSAGE: ChatMessage = { id: "welcome", role: "assistant", content: "" };

function loadIsOpen(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(OPEN_KEY) === "true";
  } catch {
    return false;
  }
}

const markdownComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mb-1 mt-2 text-sm font-bold text-slate-800" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mb-1 mt-2 text-xs font-bold text-slate-800" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mb-1 mt-2 text-xs font-semibold text-slate-800" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="mb-1.5 last:mb-0" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="mb-1.5 ml-4 list-disc space-y-0.5" {...props} />
  ),
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="mb-1.5 ml-4 list-decimal space-y-0.5" {...props} />
  ),
  li: (props: React.LiHTMLAttributes<HTMLLIElement>) => <li {...props} />,
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-slate-800" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code className="rounded bg-slate-200 px-1 py-0.5 text-[11px]" {...props} />
  ),
};

export default function FloatingChatWidget() {
  const [isOpen, setIsOpen] = useState(loadIsOpen);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const { user } = useAuth();
  const { language } = useLanguage();
  const es = language === "es";
  const historyKey = user ? `${HISTORY_KEY_PREFIX}${user.id}` : null;
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const showToast = useToast();
  const { t } = useLanguage();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // Cargar el historial del usuario actual.
  useEffect(() => {
    if (!historyKey) return;
    setHistoryLoaded(false);
    try {
      const raw = localStorage.getItem(historyKey);
      const parsed = raw ? JSON.parse(raw) : null;
      setMessages(Array.isArray(parsed) && parsed.length > 0 ? parsed : [WELCOME_MESSAGE]);
    } catch {
      setMessages([WELCOME_MESSAGE]);
    }
    setHistoryLoaded(true);
  }, [historyKey]);

  // Guardar cada cambio (solo después de haber cargado, para no pisar el historial).
  useEffect(() => {
    if (!historyKey || !historyLoaded) return;
    try {
      localStorage.setItem(historyKey, JSON.stringify(messages.slice(-MAX_SAVED_MESSAGES)));
    } catch {
      // sin almacenamiento disponible: el chat sigue funcionando sin guardar
    }
  }, [messages, historyKey, historyLoaded]);

  // Pares pregunta/respuesta, para buscar en el historial.
  const pairs = messages.reduce<{ id: string; question: string; answer: string }[]>((acc, m, i) => {
    if (m.role !== "user") return acc;
    const next = messages[i + 1];
    acc.push({ id: m.id, question: m.content, answer: next && next.role === "assistant" ? next.content : "" });
    return acc;
  }, []).reverse();
  const q = historySearch.trim().toLowerCase();
  const filteredPairs = q
    ? pairs.filter((p) => p.question.toLowerCase().includes(q) || p.answer.toLowerCase().includes(q))
    : pairs;

  function clearHistory() {
    setMessages([WELCOME_MESSAGE]);
    setHistorySearch("");
  }

  useEffect(() => {
    try {
      sessionStorage.setItem(OPEN_KEY, String(isOpen));
    } catch {
      // ignorar si sessionStorage no esta disponible
    }
  }, [isOpen]);

  async function handleSend() {
    const pregunta = input.trim();
    if (!pregunta || isSending) return;

    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: "user", content: pregunta };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const respuesta = await preguntarIA(pregunta);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: respuesta },
      ]);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : t.chat.couldNotReach,
        "error"
      );
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-200 bg-primary px-4 py-3">
            <div className="flex items-center gap-2 text-white">
              <Bot className="h-4 w-4" />
              <span className="text-sm font-semibold">{t.chat.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHistory((prev) => !prev)}
                className={`hover:text-white ${showHistory ? "text-white" : "text-white/80"}`}
                aria-label={es ? "Historial" : "History"}
                title={es ? "Historial de preguntas" : "Question history"}
              >
                <History className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white"
                aria-label={t.chat.close}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {showHistory ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-200 p-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                  <input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder={es ? "Buscar en el historial..." : "Search history..."}
                    className="w-full rounded-lg border border-slate-300 py-1.5 pl-7 pr-2 text-xs focus:border-primary focus:outline-none"
                  />
                </div>
                <button
                  onClick={clearHistory}
                  disabled={pairs.length === 0}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-red-500 disabled:opacity-40"
                  aria-label={es ? "Borrar historial" : "Clear history"}
                  title={es ? "Borrar historial" : "Clear history"}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {filteredPairs.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    {pairs.length === 0
                      ? es ? "Todavía no hay preguntas guardadas." : "No saved questions yet."
                      : es ? "Sin resultados." : "No results."}
                  </p>
                ) : (
                  filteredPairs.map((p) => (
                    <div key={p.id} className="rounded-lg border border-slate-200 p-2.5">
                      <p className="text-xs font-semibold text-slate-700">{p.question}</p>
                      {p.answer && (
                        <div className="mt-1.5 text-xs leading-relaxed text-slate-600">
                          <ReactMarkdown components={markdownComponents}>{p.answer}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
          <>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    message.role === "user" ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {message.role === "user" ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                </div>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    message.role === "user"
                      ? "whitespace-pre-wrap bg-primary text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <ReactMarkdown components={markdownComponents}>
                      {message.id === WELCOME_MESSAGE.id ? t.chat.welcome : message.content}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Bot className="h-3 w-3" />
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {t.chat.thinking}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="flex items-end gap-2 border-t border-slate-200 p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={t.chat.placeholder}
              className="flex-1 resize-none rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
          </>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:bg-primary-dark"
        aria-label={t.chat.open}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
    </div>
  );
}
