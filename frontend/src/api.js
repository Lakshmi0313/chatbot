import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 120000,
});

export async function sendMessage(message) {
  const { data } = await api.post("/chat", { message });
  return data;
}

export async function getHistory(search = "") {
  const { data } = await api.get("/history", {
    params: search ? { search } : {},
  });
  return data.messages;
}

export async function getMemories() {
  const { data } = await api.get("/memories");
  return data;
}

export async function getStats() {
  const { data } = await api.get("/stats");
  return data;
}

export async function clearHistory() {
  const { data } = await api.delete("/history");
  return data;
}

export async function exportHistory() {
  const { data } = await api.get("/export");
  return data.messages;
}

export default api;
