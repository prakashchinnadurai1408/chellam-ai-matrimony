export interface ChatMessagePayload {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface MatchPayload {
  current_profile: Record<string, unknown>;
  preferences?: Record<string, unknown> | null;
  candidates: Array<Record<string, unknown>>;
}

const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function postChat(payload: { messages: ChatMessagePayload[]; system_prompt: string }) {
  return request<{ reply: string; provider: string }>("/ai/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function postMatch(payload: MatchPayload) {
  return request<{ matches: Array<{ profile_id: string; score: number; insights: string[] }>; provider: string }>("/ai/match", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
