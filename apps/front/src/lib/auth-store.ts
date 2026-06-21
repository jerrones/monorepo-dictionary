"use client";

import { create } from "zustand";

interface AuthUser {
  id: string;
  name: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  hydrate: () => void;
}

const TOKEN_COOKIE_NAME = "dict_refresh_token";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function setCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

function removeCookie(name: string) {
  document.cookie = `${name}=;path=/;max-age=0`;
}

function decodeTokenPayload(token: string): AuthUser | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json);
    return { id: payload.userId, name: payload.name };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: (token: string, user: AuthUser) => {
    const rawToken = token.startsWith("Bearer ") ? token.slice(7) : token;
    setCookie(TOKEN_COOKIE_NAME, rawToken, COOKIE_MAX_AGE_SECONDS);
    set({ token: rawToken, user, isAuthenticated: true });
  },

  logout: () => {
    removeCookie(TOKEN_COOKIE_NAME);
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    const savedToken = getCookie(TOKEN_COOKIE_NAME);
    if (!savedToken) return;

    const user = decodeTokenPayload(savedToken);
    if (!user) {
      removeCookie(TOKEN_COOKIE_NAME);
      return;
    }

    set({ token: savedToken, user, isAuthenticated: true });
  },
}));
