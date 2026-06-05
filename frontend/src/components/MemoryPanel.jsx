import { Brain, Database, Search, Sparkles } from "lucide-react";

function Score({ value }) {
  if (value === null || value === undefined) {
    return <span className="text-xs text-slate-500 dark:text-slate-400">stored</span>;
  }

  return (
    <span className="rounded bg-sea/10 px-2 py-1 text-xs font-semibold text-sea dark:bg-sea/20 dark:text-teal-200">
      {(value * 100).toFixed(1)}%
    </span>
  );
}

export default function MemoryPanel({
  retrievedMemories,
  storedMemories,
  totalMemories,
  stats,
  searchTerm,
  onSearchTermChange,
  searchResults,
}) {
  return (
    <aside className="flex h-full flex-col border-l border-slate-200 bg-mist/80 p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="mb-4 flex items-center gap-2">
        <Brain className="text-sea" size={20} aria-hidden="true" />
        <h2 className="text-sm font-semibold text-ink dark:text-slate-100">Memory</h2>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Database size={14} aria-hidden="true" />
            Memories
          </div>
          <p className="mt-1 text-2xl font-semibold text-ink dark:text-white">{totalMemories}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles size={14} aria-hidden="true" />
            Messages
          </div>
          <p className="mt-1 text-2xl font-semibold text-ink dark:text-white">
            {stats.total_messages || 0}
          </p>
        </div>
      </div>

      <section className="mt-5">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Retrieved
        </h3>
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
          {retrievedMemories.length ? (
            retrievedMemories.map((memory) => (
              <div
                key={`${memory.id}-${memory.similarity}`}
                className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Score value={memory.similarity} />
                  <time className="text-[11px] text-slate-500 dark:text-slate-400">
                    {memory.created_at ? new Date(memory.created_at).toLocaleDateString() : ""}
                  </time>
                </div>
                <p className="line-clamp-4 text-sm leading-5 text-slate-700 dark:text-slate-200">
                  {memory.text}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Retrieved memories appear after you send a message.
            </p>
          )}
        </div>
      </section>

      <section className="mt-5">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Search Chats
        </label>
        <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
          <Search size={16} className="text-slate-400" aria-hidden="true" />
          <input
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder="Search history"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400 dark:text-slate-100"
          />
        </div>
        {searchTerm && (
          <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1 scrollbar-thin">
            {searchResults.length ? (
              searchResults.map((message) => (
                <div
                  key={message.id}
                  className="rounded-md border border-slate-200 bg-white p-2 text-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="mb-1 text-[11px] font-semibold uppercase text-slate-500">
                    {message.role}
                  </p>
                  <p className="line-clamp-3 text-slate-700 dark:text-slate-200">
                    {message.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">No matches found.</p>
            )}
          </div>
        )}
      </section>

      <section className="mt-5 min-h-0 flex-1">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Stored User Memories
        </h3>
        <div className="h-full space-y-2 overflow-y-auto pr-1 scrollbar-thin">
          {storedMemories.slice(0, 20).map((memory) => (
            <div
              key={memory.id}
              className="rounded-md border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <Score value={memory.similarity} />
                <time className="text-[11px] text-slate-500 dark:text-slate-400">
                  {memory.created_at ? new Date(memory.created_at).toLocaleDateString() : ""}
                </time>
              </div>
              <p className="line-clamp-3 text-sm text-slate-700 dark:text-slate-200">
                {memory.text}
              </p>
            </div>
          ))}
          {!storedMemories.length && (
            <p className="rounded-md border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              User messages become long-term memories after each successful chat turn.
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}
