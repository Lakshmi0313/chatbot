import { Download, Moon, RotateCcw, Send, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Message from "./Message.jsx";

export default function ChatBox({
  messages,
  onSendMessage,
  onClear,
  onExport,
  loading,
  error,
  darkMode,
  onToggleDarkMode,
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || loading) {
      return;
    }
    setDraft("");
    onSendMessage(trimmed);
  }

  return (
    <main className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-slate-50 dark:bg-slate-950">
      <header className="shrink-0 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h1 className="text-base font-semibold text-ink dark:text-white">
            AI Conversational Assistant
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Semantic memory, SQLite history, and context-aware responses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {darkMode ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={onExport}
            title="Export chat history"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClear}
            title="Clear conversation"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-coral/40 text-coral hover:bg-coral/10"
          >
            <RotateCcw size={17} aria-hidden="true" />
          </button>
        </div>
      </header>

      <section className="chat-scroll min-h-0 flex-1 basis-0 px-4 py-5 scrollbar-thin">
        <div className="mx-auto flex min-h-full max-w-4xl flex-col gap-4">
          {messages.length ? (
            messages.map((message) => <Message key={message.id} message={message} />)
          ) : (
            <div className="mx-auto mt-20 max-w-xl text-center">
              <h2 className="text-2xl font-semibold text-ink dark:text-white">
                Start a memory-aware conversation
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                Share goals, preferences, project details, or questions. The assistant stores user
                messages as semantic memories and retrieves them before future replies.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-md bg-sea" />
              <div className="rounded-md border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-sea" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-sea [animation-delay:120ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-sea [animation-delay:240ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </section>

      {error && (
        <div className="border-t border-coral/30 bg-coral/10 px-4 py-2 text-sm text-coral">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="mx-auto flex max-w-4xl items-end gap-3 rounded-md border border-slate-300 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                handleSubmit(event);
              }
            }}
            placeholder="Send a message..."
            rows={1}
            className="max-h-36 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-ink outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={loading || !draft.trim()}
            title="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sea text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700"
          >
            <Send size={17} aria-hidden="true" />
          </button>
        </div>
      </form>
    </main>
  );
}
