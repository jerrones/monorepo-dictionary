import { useAuthStore } from "./auth-store";
import type {
  AuthResponse,
  PaginatedResponse,
  WordDetail,
  HistoryItem,
  FavoriteItem,
  UserProfile,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    useAuthStore.getState().logout();
    throw new Error("Sessão expirada");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erro inesperado" }));
    throw new Error(error.message || "Erro inesperado");
  }

  return response.json();
}

export function signup(name: string, email: string, password: string) {
  return request<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function signin(email: string, password: string) {
  return request<AuthResponse>("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getEntries(cursor?: string, limit = 20, search?: string) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (limit) params.set("limit", String(limit));
  if (search) params.set("search", search);
  return request<PaginatedResponse<string>>(`/entries/en?${params.toString()}`);
}

export function getWordDetails(word: string) {
  return request<WordDetail[]>(`/entries/en/${encodeURIComponent(word)}`);
}

export function favoriteWord(word: string) {
  return request<{ message: string }>(`/entries/en/${encodeURIComponent(word)}/favorite`, {
    method: "POST",
  });
}

export function unfavoriteWord(word: string) {
  return request<{ message: string }>(`/entries/en/${encodeURIComponent(word)}/unfavorite`, {
    method: "DELETE",
  });
}

export function getHistory(cursor?: string, limit = 20) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (limit) params.set("limit", String(limit));
  return request<PaginatedResponse<HistoryItem>>(`/user/me/history?${params.toString()}`);
}

export function getFavorites(cursor?: string, limit = 20) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (limit) params.set("limit", String(limit));
  return request<PaginatedResponse<FavoriteItem>>(`/user/me/favorites?${params.toString()}`);
}

export function getProfile() {
  return request<UserProfile>("/user/me");
}
