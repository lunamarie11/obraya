"use client";

import { useState } from "react";
import { Search, MoreVertical, Mail, Phone } from "lucide-react";

interface Usuario {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "BUYER" | "DELIVERY" | "ARQUITECTO" | "COMERCIO";
  joinDate: string;
  lastActive: string;
  status: "active" | "inactive";
}

const USUARIOS: Usuario[] = [
  { id: "1", name: "María González", email: "maria@example.com", phone: "+54 11 1234 5678", role: "BUYER", joinDate: "2026-01-15", lastActive: "2026-04-18", status: "active" },
  { id: "2", name: "Juan Pérez", email: "juan@ferreteria.com", phone: "+54 11 9876 5432", role: "COMERCIO", joinDate: "2025-11-20", lastActive: "2026-04-18", status: "active" },
  { id: "3", name: "Pedro Repartidor", email: "pedro@delivery.com", phone: "+54 11 5555 4444", role: "DELIVERY", joinDate: "2026-02-01", lastActive: "2026-04-17", status: "active" },
  { id: "4", name: "Carlos Arquitecto", email: "carlos@diseño.com", phone: "+54 11 3333 2222", role: "ARQUITECTO", joinDate: "2025-12-10", lastActive: "2026-04-10", status: "inactive" },
  { id: "5", name: "Ana Compradora", email: "ana@obras.com", phone: "+54 11 7777 8888", role: "BUYER", joinDate: "2026-03-05", lastActive: "2026-04-18", status: "active" },
  { id: "6", name: "Roberto Comerciante", email: "roberto@mayorista.com", phone: "+54 11 2222 3333", role: "COMERCIO", joinDate: "2025-10-15", lastActive: "2026-04-18", status: "active" },
];

const ROLE_COLORS = {
  BUYER: "bg-emerald-100 text-emerald-800",
  DELIVERY: "bg-sky-100 text-sky-800",
  ARQUITECTO: "bg-navy-100 text-navy-800",
  COMERCIO: "bg-amber-100 text-amber-800",
};

const ROLE_LABELS = {
  BUYER: "Comprador",
  DELIVERY: "Repartidor",
  ARQUITECTO: "Arquitecto",
  COMERCIO: "Comercio",
};

export default function AdminUsuariosList() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "BUYER" | "DELIVERY" | "ARQUITECTO" | "COMERCIO">("all");

  const filtered = USUARIOS.filter((usuario) => {
    const matchesSearch = usuario.name.toLowerCase().includes(search.toLowerCase()) || usuario.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || usuario.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleCounts = {
    BUYER: USUARIOS.filter((u) => u.role === "BUYER").length,
    DELIVERY: USUARIOS.filter((u) => u.role === "DELIVERY").length,
    ARQUITECTO: USUARIOS.filter((u) => u.role === "ARQUITECTO").length,
    COMERCIO: USUARIOS.filter((u) => u.role === "COMERCIO").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Usuarios</h1>
              <p className="mt-1 text-sm text-slate-500">Gestiona y monitorea todos los usuarios de la plataforma.</p>
            </div>
            <button className="rounded-3xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition">
              + Invitar Usuario
            </button>
          </div>

          {/* Role Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            {(["BUYER", "DELIVERY", "ARQUITECTO", "COMERCIO"] as const).map((role) => (
              <div key={role} className="rounded-2xl bg-white p-4 shadow-sm border border-gray-200">
                <p className="text-xs text-slate-500 uppercase font-semibold">{ROLE_LABELS[role]}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900">{roleCounts[role]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuario por nombre o email..."
              className="w-full border border-gray-200 rounded-2xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all", "BUYER", "DELIVERY", "ARQUITECTO", "COMERCIO"] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  roleFilter === role ? "bg-amber-500 text-white" : "bg-white text-slate-700 border border-gray-200 hover:border-amber-500"
                }`}
              >
                {role === "all" ? "Todos" : ROLE_LABELS[role]}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-3xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50">
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Usuario</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Contacto</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Rol</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Miembro desde</th>
                <th className="px-6 py-4 text-left font-semibold text-slate-900">Último activo</th>
                <th className="px-6 py-4 text-center font-semibold text-slate-900"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((usuario) => (
                <tr key={usuario.id} className="border-b border-gray-200 hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{usuario.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {usuario.email}
                      </div>
                      {usuario.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {usuario.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${ROLE_COLORS[usuario.role]}`}>
                      {ROLE_LABELS[usuario.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{usuario.joinDate}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{usuario.lastActive}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition">
                      <MoreVertical className="w-4 h-4 text-slate-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
