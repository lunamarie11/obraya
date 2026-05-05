// ── ObraYa API Client ──────────────────────────────────────────────────────
// Central API layer that connects the frontend to the NestJS backend.
// All API calls go through this module.
// ───────────────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003/api";

// ── Base fetch wrapper ─────────────────────────────────────────────────────
import { getToken } from "./auth";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: any = { "Content-Type": "application/json", ...options?.headers };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_URL}${path}`, {
    headers,
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  return res.json();
}

function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][];
  return entries.length > 0 ? "?" + new URLSearchParams(entries).toString() : "";
}

// ── Products API ───────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (filters?: { category?: string; search?: string }) =>
    apiFetch<any[]>(`/products${qs(filters || {})}`),
  getOne: (id: string) =>
    apiFetch<any>(`/products/${id}`),
  create: (data: any) =>
    apiFetch<any>("/products", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiFetch<any>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiFetch<any>(`/products/${id}`, { method: "DELETE" }),
};

// ── Orders API ─────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll: (userId?: string) =>
    apiFetch<any[]>(`/orders${qs({ userId })}`),
  getOne: (id: string) =>
    apiFetch<any>(`/orders/${id}`),
  getTracking: (id: string) =>
    apiFetch<any[]>(`/orders/${id}/tracking`),
  create: (data: any) =>
    apiFetch<any>("/orders", { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    apiFetch<any>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

// ── Users API ──────────────────────────────────────────────────────────────
export const usersApi = {
  getOne: (id: string) =>
    apiFetch<any>(`/users/${id}`),
  update: (id: string, data: any) =>
    apiFetch<any>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  getAddresses: (id: string) =>
    apiFetch<any[]>(`/users/${id}/addresses`),
  addAddress: (id: string, data: any) =>
    apiFetch<any>(`/users/${id}/addresses`, { method: "POST", body: JSON.stringify(data) }),
  saveFcmToken: (id: string, token: string) =>
    apiFetch<any>(`/users/${id}/fcm-token`, { method: "POST", body: JSON.stringify({ token }) }),
};

// ── Projects API ───────────────────────────────────────────────────────────
export const projectsApi = {
  getAll: (ownerId?: string) =>
    apiFetch<any[]>(`/projects${qs({ ownerId })}`),
  getOne: (id: string) =>
    apiFetch<any>(`/projects/${id}`),
  getStats: (ownerId: string) =>
    apiFetch<any>(`/projects/stats/${ownerId}`),
  create: (data: any) =>
    apiFetch<any>("/projects", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiFetch<any>(`/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiFetch<any>(`/projects/${id}`, { method: "DELETE" }),
};

// ── Tasks API ──────────────────────────────────────────────────────────────
export const tasksApi = {
  getByProject: (projectId: string) =>
    apiFetch<any[]>(`/tasks${qs({ projectId })}`),
  getOne: (id: string) =>
    apiFetch<any>(`/tasks/${id}`),
  create: (data: any) =>
    apiFetch<any>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiFetch<any>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  move: (id: string, status: string) =>
    apiFetch<any>(`/tasks/${id}/move`, { method: "PATCH", body: JSON.stringify({ status }) }),
  remove: (id: string) =>
    apiFetch<any>(`/tasks/${id}`, { method: "DELETE" }),
};

// ── Expenses API ───────────────────────────────────────────────────────────
export const expensesApi = {
  getByProject: (projectId: string) =>
    apiFetch<any[]>(`/expenses${qs({ projectId })}`),
  getSummary: (projectId: string) =>
    apiFetch<any>(`/expenses/summary/${projectId}`),
  create: (data: any) =>
    apiFetch<any>("/expenses", { method: "POST", body: JSON.stringify(data) }),
  remove: (id: string) =>
    apiFetch<any>(`/expenses/${id}`, { method: "DELETE" }),
};

// ── Dashboard API ──────────────────────────────────────────────────────────
export const dashboardApi = {
  getArquitectoStats: (userId: string) =>
    apiFetch<any>(`/dashboard/arquitecto/${userId}`),
  getComercioStats: (period?: string) =>
    apiFetch<any>(`/dashboard/comercio${qs({ period })}`),
  getCategoryStats: () =>
    apiFetch<any[]>("/dashboard/categories"),
};
// ── Delivery API ───────────────────────────────────────────────────────────
export const deliveryApi = {
  getProfile: () =>
    apiFetch<any>("/delivery/profile"),
  getAvailableOrders: () =>
    apiFetch<any[]>("/delivery/orders/available"),
  acceptOrder: (orderId: string) =>
    apiFetch<any>(`/delivery/orders/${orderId}/accept`, { method: "POST" }),
  completeOrder: (orderId: string, tip?: number) =>
    apiFetch<any>(`/delivery/orders/${orderId}/complete`, { method: "POST", body: JSON.stringify({ tip: tip ?? 0 }) }),
  getEarnings: () =>
    apiFetch<any>("/delivery/earnings"),
};

// ── Admin API ──────────────────────────────────────────────────────────────
export const adminApi = {
  getDashboardStats: () =>
    apiFetch<any>("/admin/dashboard/stats"),
  getAllUsers: (filters?: { role?: string; search?: string; limit?: number; offset?: number }) =>
    apiFetch<any>(`/admin/users${qs({role: filters?.role, search: filters?.search, limit: filters?.limit?.toString(), offset: filters?.offset?.toString()})}`),
  getAllComercios: (filters?: { search?: string; limit?: number; offset?: number }) =>
    apiFetch<any>(`/admin/comercios${qs({search: filters?.search, limit: filters?.limit?.toString(), offset: filters?.offset?.toString()})}`),
  getAllOrders: (filters?: { status?: string; userId?: string; search?: string; limit?: number; offset?: number }) =>
    apiFetch<any>(`/admin/orders${qs({status: filters?.status, userId: filters?.userId, search: filters?.search, limit: filters?.limit?.toString(), offset: filters?.offset?.toString()})}`),
  getAllDeliveries: (filters?: { status?: string; limit?: number; offset?: number }) =>
    apiFetch<any>(`/admin/deliveries${qs({status: filters?.status, limit: filters?.limit?.toString(), offset: filters?.offset?.toString()})}`),
  updateUserRole: (userId: string, role: string) =>
    apiFetch<any>(`/admin/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  updateOrderStatus: (orderId: string, status: string) =>
    apiFetch<any>(`/admin/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};