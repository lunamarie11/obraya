// ── ObraYa Auth Client ─────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const TOKEN_KEY = "obraya_token";
const USER_KEY = "obraya_user";

export type Role = "BUYER" | "DELIVERY" | "ARQUITECTO" | "COMERCIO" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// ── Token/user persistence ─────────────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistAuth(data: AuthResponse) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  // httpOnly no es posible desde JS; usamos SameSite=Strict para reducir riesgo CSRF
  document.cookie = `${TOKEN_KEY}=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict`;
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

// ── API calls ──────────────────────────────────────────────────────────────
export const authApi = {
  async login(dto: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error de autenticación" }));
      throw new Error(err.message || "Email o contraseña incorrectos");
    }

    const data: AuthResponse = await res.json();
    persistAuth(data);
    return data;
  },

  async register(dto: { name: string; email: string; password: string; role: Role }): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "Error al registrar" }));
      throw new Error(err.message || "No pudimos crear tu cuenta");
    }

    const data: AuthResponse = await res.json();
    persistAuth(data);
    return data;
  },

  async me(): Promise<AuthUser | null> {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        clearAuth();
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  },

  logout() {
    clearAuth();
  },
};

// ── authHeader helper for other API calls ──────────────────────────────────
export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
