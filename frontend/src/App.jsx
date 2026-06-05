import { useEffect, useMemo, useState } from "react";
import ChatBox from "./components/ChatBox.jsx";
import MemoryPanel from "./components/MemoryPanel.jsx";
import {
  clearHistory,
  exportHistory,
  getHistory,
  getMemories,
  getStats,
  sendMessage,
} from "./api.js";

const emptyStats = {
  total_messages: 0,
  user_messages: 0,
  assistant_messages: 0,
  total_memories: 0,
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [retrievedMemories, setRetrievedMemories] = useState([]);
  const [storedMemories, setStoredMemories] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  const totalMemories = useMemo(
    () => stats.total_memories || storedMemories.length || 0,
    [stats.total_memories, storedMemories.length]
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        setSearchResults(await getHistory(searchTerm));
      } catch {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  async function refreshAll() {
    try {
      const [history, memoryPayload, statsPayload] = await Promise.all([
        getHistory(),
        getMemories(),
        getStats(),
      ]);
      setMessages(history);
      setStoredMemories(memoryPayload.memories || []);
      setStats(statsPayload);
    } catch (requestError) {
      setError(readError(requestError));
    }
  }

  async function handleSendMessage(message) {
    setLoading(true);
    setError("");
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: message,
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimisticMessage]);

    try {
      const payload = await sendMessage(message);
      setRetrievedMemories(payload.retrieved_memories || []);
      setMessages((current) => [
        ...current.filter((item) => item.id !== optimisticMessage.id),
        payload.user_message,
        payload.assistant_message,
      ]);
      await refreshMemoryAndStats();
    } catch (requestError) {
      setMessages((current) => current.filter((item) => item.id !== optimisticMessage.id));
      setError(readError(requestError));
    } finally {
      setLoading(false);
    }
  }

  async function refreshMemoryAndStats() {
    const [memoryPayload, statsPayload] = await Promise.all([getMemories(), getStats()]);
    setStoredMemories(memoryPayload.memories || []);
    setStats(statsPayload);
  }

  async function handleClear() {
    setError("");
    try {
      await clearHistory();
      setMessages([]);
      setRetrievedMemories([]);
      setStoredMemories([]);
      setStats(emptyStats);
      setSearchResults([]);
      setSearchTerm("");
    } catch (requestError) {
      setError(readError(requestError));
    }
  }

  async function handleExport() {
    setError("");
    try {
      const exportedMessages = await exportHistory();
      const blob = new Blob([JSON.stringify(exportedMessages, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `chat-history-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(readError(requestError));
    }
  }

  return (
    <div className="h-full min-h-0 overflow-hidden bg-slate-50 text-ink dark:bg-slate-950">
      <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          onClear={handleClear}
          onExport={handleExport}
          loading={loading}
          error={error}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((value) => !value)}
        />
        <div className="hidden min-h-0 lg:block">
          <MemoryPanel
            retrievedMemories={retrievedMemories}
            storedMemories={storedMemories}
            totalMemories={totalMemories}
            stats={stats}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            searchResults={searchResults}
          />
        </div>
      </div>
    </div>
  );
}

function readError(error) {
  return (
    error?.response?.data?.detail ||
    error?.message ||
    "Something went wrong while contacting the assistant."
  );
}
