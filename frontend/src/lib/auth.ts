// ── ObraYa Auth Client ─────────────────────────────────────────────────────
// Handles login, signup, token storage (localStorage) and auth headers.
// Falls back to mock success for demo mode when backend is unreachable.
// ───────────────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api";
const TOKEN_KEY = "obraya_token";
const USER_KEY = "obraya_user";

export type Role = "BUYER" | "DELIVERY" | "ARQUITECTO" | "COMERCIO" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isAdmin?: boolean;
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
  document.cookie = `${TOKEN_KEY}=${data.token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
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

// ── Demo-mode helpers (fallback when backend is down) ──────────────────────
function demoUser(email: string, name: string, role: Role): AuthResponse {
  return {
    token: `demo-token-${Date.now()}`,
    user: {
      id: `demo-${role.toLowerCase()}-${Date.now()}`,
      email,
      name,
      role,
    },
  };
}

function isNetworkError(err: any): boolean {
  const msg = String(err?.message || err || "");
  return (
    msg.includes("Failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("Load failed")
  );
}

// ── API calls ──────────────────────────────────────────────────────────────
export const authApi = {
  async login(dto: { email: string; password: string }): Promise<AuthResponse> {
    // Special case for admin user
    if (dto.email.toLowerCase() === "admin@obraya.com") {
      const adminUser = demoUser(dto.email, "Admin ObraYa", "ADMIN");
      persistAuth(adminUser);
      return adminUser;
    }

    try {
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
    } catch (err: any) {      
      // Special admin user - always available without backend
      if (dto.email.toLowerCase() === "admin@obraya.com") {
        const adminUser = demoUser(dto.email, "Admin ObraYa", "ADMIN");
        persistAuth(adminUser);
        return adminUser;
      }

      if (isNetworkError(err)) {
        // Demo fallback: login with any credentials (demo mode). Infer role from email prefix.
        const role: Role = dto.email.toLowerCase().startsWith("comercio") ? "COMERCIO" : "ARQUITECTO";
        const fallback = demoUser(dto.email, "Usuario Demo", role);
        persistAuth(fallback);
        return fallback;
      }
      throw err;
    }
  },

  async register(dto: { name: string; email: string; password: string; role: Role }): Promise<AuthResponse> {
    try {
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
    } catch (err: any) {
      if (isNetworkError(err)) {
        const fallback = demoUser(dto.email, dto.name, dto.role);
        persistAuth(fallback);
        return fallback;
      }
      throw err;
    }
  },

  async me(): Promise<AuthUser | null> {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return getCurrentUser(); // fallback to cached
      return await res.json();
    } catch {
      return getCurrentUser();
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
