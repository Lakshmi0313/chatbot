import { Bot, UserRound } from "lucide-react";

export default function Message({ message }) {
  const isUser = message.role === "user";

  return (
    <article className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sea text-white">
          <Bot size={18} aria-hidden="true" />
        </div>
      )}

      <div
        className={`max-w-[82%] rounded-md border px-4 py-3 shadow-sm md:max-w-[70%] ${
          isUser
            ? "border-sea/20 bg-sea text-white"
            : "border-slate-200 bg-white text-ink dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
        <time
          className={`mt-2 block text-[11px] ${
            isUser ? "text-white/75" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {new Date(message.created_at).toLocaleString()}
        </time>
      </div>

      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-coral text-white">
          <UserRound size={18} aria-hidden="true" />
        </div>
      )}
    </article>
  );
}
